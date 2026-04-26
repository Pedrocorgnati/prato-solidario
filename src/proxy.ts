import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROUTES } from '@/lib/constants'
import { env } from '@/lib/env'
import { matchRoute, buildLoginRedirect, buildRedirectUrl } from '@/lib/auth/middleware-utils'
import { prisma } from '@/lib/prisma'
import { isAllowedOrigin, buildCorsHeaders } from '@/lib/cors'
import {
  rateLimit,
  buildRateLimitKey,
  getClientIp,
  getRouteLimit,
  rateLimitHeaders,
} from '@/lib/rate-limit'

// ---------------------------------------------------------------------------
// proxy.ts — Next.js 16+ (substitui middleware.ts)
// Responsabilidades:
//   1. CORS + rate limit em /api/v1/* (intake-review TASK-1)
//   2. Correlation-id propagado em todo request (TASK-2)
//   3. Protecao de rotas por role com Supabase SSR (rotas UI)
// ---------------------------------------------------------------------------

const API_PUBLIC_PREFIX = '/api/v1/'
// Rotas que nao devem passar por rate-limit global (webhooks assinados, internals com CRON_SECRET)
const API_RATE_LIMIT_BYPASS = [
  '/api/v1/webhooks/',
  '/api/v1/internal/',
]

function pickRouteClass(pathname: string): 'auth' | 'codes' | 'contact' | 'default' {
  if (pathname.startsWith('/api/v1/auth/')) return 'auth'
  if (pathname.startsWith('/api/v1/codes')) return 'codes'
  if (pathname.startsWith('/api/v1/contact')) return 'contact'
  return 'default'
}

function ensureCorrelationId(request: NextRequest): string {
  const existing = request.headers.get('x-request-id')
  if (existing && existing.length > 0) return existing
  return crypto.randomUUID()
}

async function handleApi(request: NextRequest, correlationId: string): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')

  // ---- CORS ----
  // Preflight OPTIONS
  if (request.method === 'OPTIONS') {
    if (!origin || isAllowedOrigin(origin)) {
      const headers = origin ? buildCorsHeaders(origin) : {}
      return new NextResponse(null, { status: 204, headers })
    }
    return new NextResponse(null, { status: 403 })
  }

  // Browser request com Origin listado — rejeitar se nao permitido.
  // Requests sem Origin (curl, server-to-server) passam.
  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json(
      { error: 'forbidden_origin', message: 'Origin not allowed' },
      { status: 403 },
    )
  }

  // ---- Rate limit ----
  const shouldRateLimit = !API_RATE_LIMIT_BYPASS.some((prefix) => pathname.startsWith(prefix))
  let rlResult: Awaited<ReturnType<typeof rateLimit>> | null = null

  if (shouldRateLimit) {
    const routeClass = pickRouteClass(pathname)
    const ip = getClientIp(request.headers)
    const key = buildRateLimitKey(routeClass, { ip })
    const limit = getRouteLimit(routeClass)
    rlResult = await rateLimit({ key, limit, windowMs: 60_000 })

    if (!rlResult.allowed) {
      const headers = new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'x-request-id': correlationId,
        ...rateLimitHeaders(rlResult),
      })
      if (origin && isAllowedOrigin(origin)) {
        for (const [k, v] of Object.entries(buildCorsHeaders(origin))) headers.set(k, v)
      }
      return new NextResponse(
        JSON.stringify({
          error: 'too_many_requests',
          retryAfter: rlResult.retryAfterSeconds,
        }),
        { status: 429, headers },
      )
    }
  }

  // Passa adiante. Anexa CORS headers + rate limit + correlation-id no response.
  const response = NextResponse.next({ request })
  response.headers.set('x-request-id', correlationId)
  if (origin && isAllowedOrigin(origin)) {
    for (const [k, v] of Object.entries(buildCorsHeaders(origin))) response.headers.set(k, v)
  }
  if (rlResult) {
    for (const [k, v] of Object.entries(rateLimitHeaders(rlResult))) response.headers.set(k, v)
  }
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const correlationId = ensureCorrelationId(request)

  // -------------------------------------------------------------------------
  // A. API /api/v1/* — CORS + rate limit (intake-review TASK-1)
  // -------------------------------------------------------------------------
  if (pathname.startsWith(API_PUBLIC_PREFIX)) {
    return handleApi(request, correlationId)
  }

  // -------------------------------------------------------------------------
  // B. UI rate limit legado (mantido — /login POST header-based)
  // -------------------------------------------------------------------------
  if (pathname === ROUTES.LOGIN && request.method === 'POST') {
    const remaining = request.headers.get('x-ratelimit-remaining')
    if (remaining === '0') {
      return new NextResponse(
        JSON.stringify({ error: 'Muitas requisições. Tente novamente em breve.' }),
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'Content-Type': 'application/json; charset=utf-8',
            'x-request-id': correlationId,
          },
        },
      )
    }
  }

  // -------------------------------------------------------------------------
  // C. Session refresh (Supabase SSR) + protecao por role
  // -------------------------------------------------------------------------
  let supabaseResponse = NextResponse.next({ request })
  supabaseResponse.headers.set('x-request-id', correlationId)

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          supabaseResponse.headers.set('x-request-id', correlationId)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const rule = matchRoute(pathname)

  if (!rule) {
    addSecurityHeaders(supabaseResponse)
    return supabaseResponse
  }

  if (!user) {
    return NextResponse.redirect(buildLoginRedirect(request))
  }

  const dbUser = await prisma.user
    .findUnique({ where: { id: user.id }, select: { isActive: true, deletedAt: true } })
    .catch(() => null)

  if (dbUser && (!dbUser.isActive || dbUser.deletedAt !== null)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(buildRedirectUrl(request, '/conta-excluida'))
  }

  if (rule.requireAuth && !rule.allowedRoles) {
    addSecurityHeaders(supabaseResponse)
    return supabaseResponse
  }

  const role = user.user_metadata?.role as string | undefined
  if (rule.allowedRoles && (!role || !rule.allowedRoles.includes(role))) {
    return NextResponse.redirect(buildRedirectUrl(request, '/403'))
  }

  addSecurityHeaders(supabaseResponse)
  return supabaseResponse
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()',
  )
}

export const config = {
  matcher: [
    // UI: tudo menos assets
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
