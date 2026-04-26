/**
 * POST /api/v1/internal/crons/abuse-cleanup
 *
 * Cron semanal (domingo 04:00 UTC): deleta AbuseRecords com blockedUntil
 * há mais de 90 dias. Bloqueios ativos (blockedUntil no futuro) são preservados.
 *
 * Retention policy: 90 dias mínimo para detecção de padrões recorrentes.
 * @see module-23-crons-jobs/TASK-4/ST002
 */

import { type NextRequest } from 'next/server'
import { validateCronRequest, cronUnauthorized } from '@/lib/cron-guard'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

const ABUSE_RETENTION_DAYS = 90

export async function POST(request: NextRequest) {
  if (!validateCronRequest(request)) return cronUnauthorized()

  try {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - ABUSE_RETENTION_DAYS)

    // Deletar apenas registros EXPIRADOS há mais de 90 dias.
    // blockedUntil no futuro = bloqueio ativo → NUNCA deletado.
    const { count: deleted } = await prisma.abuseRecord.deleteMany({
      where: {
        blockedUntil: { lt: threshold },
      },
    })

    logger.info({ deleted }, 'cron:abuse-cleanup')
    return Response.json({ ok: true, deleted })
  } catch (err) {
    logger.error({ err }, 'cron:abuse-cleanup:error')
    return Response.json({ ok: false, error: 'CRON_FAILURE' }, { status: 500 })
  }
}
