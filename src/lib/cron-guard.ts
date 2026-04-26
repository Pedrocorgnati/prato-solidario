/**
 * CronGuard — proteção de endpoints internos de cron jobs.
 *
 * Aceita autenticação por dois métodos:
 *   1. Header "x-vercel-cron: 1" — disparado automaticamente pelo Vercel Cron Jobs
 *   2. Header "Authorization: Bearer {CRON_SECRET}" — testes locais / chamadas manuais
 *
 * Tentativas inválidas são logadas com IP para auditoria.
 *
 * @see module-23-crons-jobs/TASK-1/ST001
 */

import { type NextRequest } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

function safeCompare(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a, 'utf8')
    const bBuf = Buffer.from(b, 'utf8')
    if (aBuf.length !== bBuf.length) return false
    return timingSafeEqual(aBuf, bBuf)
  } catch {
    return false
  }
}

export function validateCronRequest(request: NextRequest): boolean {
  // Vercel Cron Jobs injeta este header automaticamente
  const vercelCron = request.headers.get('x-vercel-cron')
  if (vercelCron === '1') return true

  // Auth manual via Bearer token (testes locais / chamadas externas)
  // timingSafeEqual previne timing attacks na comparação de secrets
  const auth = request.headers.get('authorization')
  if (env.CRON_SECRET && auth && safeCompare(auth, `Bearer ${env.CRON_SECRET}`)) return true

  // Log tentativas inválidas com IP para auditoria
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  logger.warn({ ip, path: request.nextUrl.pathname }, 'cron-guard: unauthorized attempt')
  return false
}

export function cronUnauthorized(): Response {
  return Response.json({ ok: false, error: 'AUTH_001' }, { status: 401 })
}
