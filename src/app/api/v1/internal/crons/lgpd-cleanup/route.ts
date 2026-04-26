/**
 * POST /api/v1/internal/crons/lgpd-cleanup
 *
 * Cron diário (03:00 UTC): anonimiza dados pessoais de usuários com
 * deletedAt >= 30 dias, em batches de 10. Idempotente via anonymizedAt.
 *
 * LGPD Art. 16: exclusão após término do tratamento.
 * Rastreabilidade INTAKE: INT-121, INT-119
 * @see module-23-crons-jobs/TASK-4/ST001
 */

import { type NextRequest } from 'next/server'
import { validateCronRequest, cronUnauthorized } from '@/lib/cron-guard'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { anonymizeUser } from '@/services/lgpd.service'

const BATCH_SIZE = 10
const LGPD_DAYS = 30

export async function POST(request: NextRequest) {
  if (!validateCronRequest(request)) return cronUnauthorized()

  try {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - LGPD_DAYS)

    // Buscar usuários elegíveis: deletados há 30+ dias e ainda não anonimizados
    const users = await prisma.user.findMany({
      where: {
        deletedAt: { not: null, lte: threshold },
        anonymizedAt: null,
      },
      select: { id: true },
    })

    let anonymized = 0
    let failed = 0

    // Processar em batches de 10 para não sobrecarregar o DB
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map(({ id }) => anonymizeUser(id))
      )
      for (const r of results) {
        if (r.status === 'fulfilled') {
          anonymized++
        } else {
          failed++
          logger.error({ err: r.reason }, 'cron:lgpd-cleanup:item-failed')
        }
      }
    }

    logger.info({ anonymized, failed, total: users.length }, 'cron:lgpd-cleanup')
    return Response.json({ ok: true, anonymized, failed })
  } catch (err) {
    logger.error({ err }, 'cron:lgpd-cleanup:error')
    return Response.json({ ok: false, error: 'CRON_FAILURE' }, { status: 500 })
  }
}
