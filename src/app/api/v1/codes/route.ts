/**
 * GET  /api/v1/codes — Lista códigos ativos do usuário autenticado (doador ou ONG)
 * POST /api/v1/codes — Gera código de retirada (receptor)
 * @see module-10-codigos-historico/TASK-1/ST002
 * @see module-9-retirada-publica/TASK-6
 */

import { NextResponse, type NextRequest } from 'next/server'
import { matchingService } from '@/services/matching.service'
import type { MatchingResult, MatchingFailure } from '@/services/matching.service'
import { abuseService } from '@/services/abuse.service'
import { RequestRetrievalDto } from '@/types/dto'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/enums'
import { getServerSession } from '@/lib/auth/session'
import { retrievalRepository } from '@/repositories/retrieval.repository'
import { createRequestLogger } from '@/lib/logger'
import { withIdempotency, isValidIdempotencyKey } from '@/lib/idempotency'

// ---------------------------------------------------------------------------
// Rate limiting para GET (30 req/min por userId) — TASK-1/ST002
// ---------------------------------------------------------------------------

const getCodesRateLimit = new Map<string, { count: number; resetAt: number }>()
const GET_CODES_RATE_LIMIT = 30

// ---------------------------------------------------------------------------
// GET /api/v1/codes — Listar códigos ativos do usuário autenticado
// ---------------------------------------------------------------------------

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json(
      { error: 'AUTH_001', message: 'Não autenticado.' },
      { status: 401 }
    )
  }

  // Rate limit: 30 req/min por userId
  const rlKey = session.id
  const rlEntry = getCodesRateLimit.get(rlKey)
  const now = Date.now()
  if (rlEntry && now < rlEntry.resetAt) {
    rlEntry.count++
    if (rlEntry.count > GET_CODES_RATE_LIMIT) {
      return NextResponse.json(
        { error: 'RATE_001', message: 'Muitas requisições. Aguarde antes de tentar novamente.' },
        { status: 429 }
      )
    }
  } else {
    getCodesRateLimit.set(rlKey, { count: 1, resetAt: now + 60_000 })
  }

  try {
    const role = session.role as string
    const isOng = role === 'ONG'
    const isDonor = role === 'DOADOR_PF' || role === 'DOADOR_RESTAURANTE'

    if (isOng) {
      const codes = await retrievalRepository.getActiveCodesByOngId(session.id)
      return NextResponse.json({ data: codes })
    }

    if (isDonor) {
      const codes = await retrievalRepository.getActiveCodesByDonorId(session.id)
      return NextResponse.json({ data: codes })
    }

    // Outros roles não têm acesso a este endpoint
    return NextResponse.json(
      { error: 'AUTH_004', message: 'Role sem acesso a este recurso.' },
      { status: 403 }
    )
  } catch (err) {
    const log = createRequestLogger({
      correlationId: crypto.randomUUID(),
      userId: session.id,
      route: '/api/v1/codes:GET',
    })
    log.error({ err: String(err) }, 'codes.get.internal_error')
    return NextResponse.json(
      { error: 'SYS_001', message: 'Erro interno. Tente novamente.' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// Helpers de extração
// ---------------------------------------------------------------------------

function extractIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '0.0.0.0'
  )
}

function extractFingerprint(request: NextRequest): string {
  const headerFp = request.headers.get('x-device-fingerprint')
  if (headerFp) return headerFp.slice(0, 64)

  // Fallback server-side quando header ausente (INT-064)
  const ua = request.headers.get('user-agent') ?? ''
  const lang = request.headers.get('accept-language') ?? ''
  return Buffer.from(`${ua}:${lang}`).toString('base64').slice(0, 32)
}

// ---------------------------------------------------------------------------
// Rate limit per-minute no POST /codes (ARCH-007)
// ---------------------------------------------------------------------------

const codesRateLimit = new Map<string, { count: number; resetAt: number }>()
const CODES_RATE_LIMIT = 10 // 10 req/min per IP

// ---------------------------------------------------------------------------
// Tracking de abuso — conta solicitações por IP e escala para recordAbuse
// ---------------------------------------------------------------------------

const codeRequestCounts = new Map<string, { count: number; resetAt: number }>()
const CODE_REQUEST_LIMIT = 5 // máx solicitações por IP em 10 minutos antes de escalar para recordAbuse
const CODE_REQUEST_WINDOW_MS = 10 * 60 * 1000 // 10 minutos

async function trackCodeRequest(ip: string, fingerprint: string): Promise<void> {
  const now = Date.now()
  const key = `${ip}:${fingerprint}`
  const entry = codeRequestCounts.get(key)

  if (!entry || now > entry.resetAt) {
    codeRequestCounts.set(key, { count: 1, resetAt: now + CODE_REQUEST_WINDOW_MS })
    return
  }

  entry.count++
  if (entry.count > CODE_REQUEST_LIMIT) {
    // Escalar para bloqueio progressivo (1→2→3 dias — INT-065)
    await abuseService.recordAbuse(ip, fingerprint, 'Excesso de solicitações de código')
    codeRequestCounts.delete(key)
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Idempotency-Key (TASK-8/ST003) — aceita header opcional; chaves inválidas
  // são ignoradas silenciosamente para não quebrar clientes legados.
  const idempotencyKeyRaw = request.headers.get('idempotency-key')
  const idempotencyKey = isValidIdempotencyKey(idempotencyKeyRaw) ? idempotencyKeyRaw : null

  if (idempotencyKey) {
    const bodyText = await request.text()
    const cached = await withIdempotency(`codes:POST:${idempotencyKey}`, async () => {
      // Reconstrói a request com o body já consumido
      const replay = new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: bodyText,
      }) as unknown as NextRequest
      const resp = await postHandler(replay)
      const respBody = await resp.text()
      return {
        status: resp.status,
        body: respBody,
        contentType: resp.headers.get('content-type') ?? 'application/json',
      }
    })
    return new NextResponse(cached.body, {
      status: cached.status,
      headers: { 'content-type': cached.contentType, 'idempotency-replayed': 'true' },
    })
  }

  return postHandler(request)
}

async function postHandler(request: NextRequest): Promise<NextResponse> {
  const ip = extractIp(request)
  const fingerprint = extractFingerprint(request)
  // ipFingerprint é o identificador composto (IP:fingerprint) para anônimos
  const ipFingerprint = `${ip}:${fingerprint}`

  // 1. Verificar anti-abuso imediatamente
  const abuseCheck = await abuseService.checkAbuse(ip, fingerprint)
  if (abuseCheck.blocked) {
    return NextResponse.json(
      {
        error: 'RATE_001',
        message: abuseCheck.reason ?? 'Você atingiu o limite de solicitações.',
        unblockedAt: abuseCheck.unblockedAt?.toISOString(),
      },
      { status: 429 }
    )
  }

  // 2. Validar body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'VAL_001', message: 'Body inválido ou ausente.' },
      { status: 400 }
    )
  }

  const parsed = RequestRetrievalDto.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const field = issue?.path?.[0] ?? 'campo'
    const isCoords = field === 'lat' || field === 'lng'
    return NextResponse.json(
      {
        error: isCoords ? 'VAL_002' : 'VAL_001',
        message: issue?.message ?? 'Dados inválidos.',
      },
      { status: 400 }
    )
  }

  const { lat, lng, quantity, donationId: preferredDonationId } = parsed.data

  // 3. Extrair usuário autenticado (opcional — não obrigatório — INT-027)
  let userId: string | null = null
  let userRole: UserRole | null = null
  let ongVerified = false

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
      // Buscar role do usuário no banco
      const { prisma } = await import('@/lib/prisma')
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, ongProfile: { select: { id: true } } },
      })
      if (dbUser) {
        userRole = dbUser.role as UserRole
        ongVerified = !!dbUser.ongProfile
      }
    }
  } catch {
    // Falha na autenticação não bloqueia — endpoint é público
  }

  // 4. Rate limit per-minute no POST /codes (ARCH-007 dual rate limit)
  const rlKey = `codes:${ip}`
  const rlEntry = codesRateLimit.get(rlKey)
  const rlNow = Date.now()
  if (rlEntry && rlNow < rlEntry.resetAt) {
    rlEntry.count++
    if (rlEntry.count > CODES_RATE_LIMIT) {
      const retryAfter = Math.ceil((rlEntry.resetAt - rlNow) / 1000)
      return NextResponse.json(
        { error: 'RATE_001', message: 'Muitas solicitações. Aguarde antes de tentar novamente.', retryAfter },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(CODES_RATE_LIMIT),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rlEntry.resetAt / 1000)),
          },
        }
      )
    }
  } else {
    codesRateLimit.set(rlKey, { count: 1, resetAt: rlNow + 60_000 })
  }

  // 5. Executar matching
  const receptorInfo = {
    role: userRole,
    groupSize: quantity,
    location: { lat, lng },
    ipFingerprint,
    userId,
    ongVerified,
  }

  try {
    const result = preferredDonationId
      ? await matchingService.matchDonationToReceptor(
          { lat, lng },
          quantity,
          receptorInfo,
          preferredDonationId
        )
      : await matchingService.matchDonationToReceptor(
          { lat, lng },
          quantity,
          receptorInfo
        )

    // Tipo-guard: discriminated union por `available`
    const isFailure = (r: MatchingResult | MatchingFailure): r is MatchingFailure =>
      r.available === false

    if (isFailure(result)) {
      if (result.reason === 'ABUSE_BLOCKED') {
        return NextResponse.json(
          {
            error: 'RATE_001',
            message: result.message,
            unblockedAt: result.unblockedAt?.toISOString(),
          },
          { status: 429 }
        )
      }

      // Sem doações disponíveis — retorna 200 com available: false
      return NextResponse.json(
        {
          available: false,
          message: result.message,
          reason: result.reason,
          activeCode: result.activeCode
            ? {
                code: result.activeCode.code,
                expiresAt: result.activeCode.expiresAt.toISOString(),
              }
            : undefined,
        },
        { status: 200 }
      )
    }

    // Sucesso: registrar uso legítimo para tracking de abuso futuro (fire-and-forget)
    trackCodeRequest(ip, fingerprint).catch(() => {})

    // Resposta com campos permitidos APENAS (nunca endereço completo)
    return NextResponse.json(
      {
        code: result.code,
        expiresAt: result.expiresAt.toISOString(),
        donorBairro: result.donorBairro,
        donorCidade: result.donorCidade,
        quantity: result.portions,
        windowStart: result.windowStart.toISOString(),
        windowEnd: result.windowEnd.toISOString(),
        // PROIBIDO: donorAddress, donorName, donorId, lat, lng
      },
      { status: 201 }
    )

  } catch (err) {
    const message = err instanceof Error ? err.message : ''

    // Race condition: doação alocada por outro receptor
    if (message.includes('DONATION_ALLOCATED')) {
      return NextResponse.json(
        {
          available: false,
          message: 'Essa doação foi alocada por outro receptor. Buscando alternativa...',
          reason: 'RACE_CONDITION',
        },
        { status: 200 }
      )
    }

    const log = createRequestLogger({
      correlationId: request.headers.get('x-request-id') ?? crypto.randomUUID(),
      userId: userId ?? undefined,
      route: '/api/v1/codes:POST',
    })
    log.error({ err: String(err), ip }, 'codes.post.internal_error')
    return NextResponse.json(
      { error: 'SYS_001', message: 'Erro interno. Tente novamente.' },
      { status: 500 }
    )
  }
}
