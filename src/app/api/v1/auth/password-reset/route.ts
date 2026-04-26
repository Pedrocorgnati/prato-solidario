import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { passwordResetRequestSchema } from '@/schemas/auth.schema'
import { rateLimit, buildRateLimitKey, getClientIp, rateLimitHeaders } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  // Reforco inline sobre o proxy — limite estrito por IP contra brute force/enum
  // (intake-review TASK-1/ST004): 5 tentativas por hora.
  const ip = getClientIp(request.headers)
  const key = buildRateLimitKey('auth:password-reset', { ip })
  const rl = await rateLimit({ key, limit: 5, windowMs: 60 * 60 * 1000 })

  if (!rl.allowed) {
    logger.warn({ route: '/api/v1/auth/password-reset', ip }, 'auth.password_reset.rate_limited')
    return Response.json(
      { error: 'RATE_001', message: 'Muitas tentativas. Tente novamente em 1 hora.', retryAfter: rl.retryAfterSeconds },
      { status: 429, headers: rateLimitHeaders(rl) },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'VAL_001', message: 'Payload inválido.' }, { status: 400 })
  }

  const parsed = passwordResetRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'VAL_002', message: 'E-mail inválido.', fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  // Resposta uniforme independente de o e-mail existir (proteção contra enumeração)
  await authService.resetPassword(parsed.data.email).catch(() => {})
  return Response.json({ message: 'Se este e-mail estiver cadastrado, você receberá um link.' })
}
