/**
 * Rate limiting.
 *
 * Dois helpers:
 *   - checkDonationRateLimit(donorId, limit?, windowSeconds?) — specialized,
 *     conta via tabela donations (usado em module-8-doacao-form/TASK-2/ST005).
 *   - rateLimit({ key, limit, windowMs }) — generic sliding window, in-memory.
 *     Para prod multi-instancia, trocar por @upstash/ratelimit (fallback automatico
 *     quando UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN estiverem definidos).
 *
 * @see intake-review/TASK-1/ST002 (CL-285, CL-332)
 */

// Nota: `@/lib/prisma` e importado lazy dentro de `checkDonationRateLimit`
// para evitar side-effects de modulo ao rodar testes unit que nao precisam do DB.

// ---------------------------------------------------------------------------
// Donation-specific rate limit (preservado)
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export async function checkDonationRateLimit(
  donorId: string,
  limit = 10,
  windowSeconds = 3600,
): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowSeconds * 1000)
  const resetAt = new Date(windowStart.getTime() + windowSeconds * 1000)

  try {
    const { prisma } = await import('@/lib/prisma')
    const count = await prisma.donation.count({
      where: {
        donorId,
        createdAt: { gte: windowStart },
      },
    })

    const remaining = Math.max(0, limit - count)
    const allowed = count < limit

    return { allowed, remaining, resetAt }
  } catch {
    console.warn('[RateLimit] Falha ao verificar rate limit — permitindo requisição')
    return { allowed: true, remaining: limit, resetAt }
  }
}

// ---------------------------------------------------------------------------
// Generic sliding window (in-memory com TTL cleanup)
// ---------------------------------------------------------------------------

interface GenericEntry {
  count: number
  resetAt: number
}

const genericStore = new Map<string, GenericEntry>()
const GENERIC_CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let genericLastCleanup = Date.now()

function cleanupGeneric() {
  const now = Date.now()
  if (now - genericLastCleanup < GENERIC_CLEANUP_INTERVAL_MS) return
  genericLastCleanup = now
  for (const [key, entry] of genericStore) {
    if (now > entry.resetAt) genericStore.delete(key)
  }
}

export interface GenericRateLimitOptions {
  key: string
  limit: number
  windowMs: number
}

export interface GenericRateLimitResult {
  allowed: boolean
  remaining: number
  reset: Date
  limit: number
  retryAfterSeconds: number
}

/**
 * Sliding window in-memory rate limit. Retorna `allowed` e metadata para headers.
 *
 * @example
 *   const rl = await rateLimit({ key: `ip:${ip}:codes`, limit: 20, windowMs: 60_000 })
 *   if (!rl.allowed) return NextResponse.json({ error: 'too_many_requests' }, { status: 429 })
 */
export async function rateLimit(
  options: GenericRateLimitOptions,
): Promise<GenericRateLimitResult> {
  const { key, limit, windowMs } = options
  cleanupGeneric()

  const now = Date.now()
  const entry = genericStore.get(key)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    genericStore.set(key, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: limit - 1,
      reset: new Date(resetAt),
      limit,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    }
  }

  entry.count++
  const remaining = Math.max(0, limit - entry.count)
  const allowed = entry.count <= limit
  const retryAfterSeconds = allowed ? 0 : Math.max(1, Math.ceil((entry.resetAt - now) / 1000))

  return {
    allowed,
    remaining,
    reset: new Date(entry.resetAt),
    limit,
    retryAfterSeconds,
  }
}

/**
 * Monta headers padrao de rate limit para anexar a response.
 */
export function rateLimitHeaders(result: GenericRateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.reset.getTime() / 1000)),
  }
  if (!result.allowed && result.retryAfterSeconds > 0) {
    headers['Retry-After'] = String(result.retryAfterSeconds)
  }
  return headers
}

/**
 * Builder de key padrao. Prioriza userId; fallback para IP.
 */
export function buildRateLimitKey(
  routeKey: string,
  ctx: { userId?: string | null; ip?: string | null },
): string {
  if (ctx.userId) return `user:${ctx.userId}:${routeKey}`
  const ip = ctx.ip || 'unknown'
  return `ip:${ip}:${routeKey}`
}

/**
 * Extrai IP do request em ambientes Vercel/proxy (honra x-forwarded-for, x-real-ip).
 */
export function getClientIp(headers: Headers | Record<string, string | string[] | undefined>): string {
  const get = (name: string): string | undefined => {
    if (headers instanceof Headers) return headers.get(name) ?? undefined
    const v = headers[name.toLowerCase()] ?? headers[name]
    if (Array.isArray(v)) return v[0]
    return v as string | undefined
  }
  const xff = get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  const real = get('x-real-ip')
  if (real) return real
  return 'unknown'
}

/**
 * Classificacao de limites por rota. Lido de env com fallback.
 */
export function getRouteLimit(routeClass: 'auth' | 'codes' | 'contact' | 'default'): number {
  const envVar = `RATE_LIMIT_${routeClass.toUpperCase()}`
  const raw = process.env[envVar]
  const parsed = raw ? Number.parseInt(raw, 10) : NaN
  if (Number.isFinite(parsed) && parsed > 0) return parsed

  switch (routeClass) {
    case 'auth':
      return 10
    case 'codes':
      return 20
    case 'contact':
      return 3
    case 'default':
    default:
      return 60
  }
}
