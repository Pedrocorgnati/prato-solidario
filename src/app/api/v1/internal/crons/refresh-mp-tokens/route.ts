/**
 * POST /api/v1/internal/crons/refresh-mp-tokens
 *
 * Cron a cada 6h: renova proativamente tokens MercadoPago que vencem
 * nas próximas 6h. Falhas individuais são logadas sem abortar o loop.
 *
 * @see module-23-crons-jobs/TASK-2/ST002
 */

import { type NextRequest } from 'next/server'
import { validateCronRequest, cronUnauthorized } from '@/lib/cron-guard'
import { logger } from '@/lib/logger'
import { mpConnectionRepository } from '@/repositories/mp-connection.repository'
import { refreshMPToken } from '@/services/mercadopago.service'

export async function POST(request: NextRequest) {
  if (!validateCronRequest(request)) return cronUnauthorized()

  // Conexões expirando nas próximas 6h (360 min)
  const expiringSoon = await mpConnectionRepository.findExpiringSoon(360)

  const BATCH_SIZE = 5
  let refreshed = 0
  let failed = 0
  for (let i = 0; i < expiringSoon.length; i += BATCH_SIZE) {
    const batch = expiringSoon.slice(i, i + BATCH_SIZE)
    await Promise.allSettled(
      batch.map(async (connection) => {
        try {
          await refreshMPToken(connection.id)
          refreshed++
        } catch (err) {
          failed++
          logger.error({ connectionId: connection.id, err }, 'cron:refresh-mp-tokens:failed')
        }
      })
    )
  }

  logger.info({ refreshed, failed }, 'cron:refresh-mp-tokens')
  return Response.json({ ok: true, refreshed, failed })
}
