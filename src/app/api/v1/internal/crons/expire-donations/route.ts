/**
 * POST /api/v1/internal/crons/expire-donations
 *
 * Cron a cada 5min: expira RetrievalCodes vencidos e Donations fora da
 * janela de retirada. Idempotente (re-executável sem efeito colateral).
 *
 * @see module-23-crons-jobs/TASK-1/ST002
 */

import { type NextRequest } from 'next/server'
import { validateCronRequest, cronUnauthorized } from '@/lib/cron-guard'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { retrievalService } from '@/services/retrieval.service'
import { DonationStatus, RetrievalCodeStatus } from '@/types/enums'

export async function POST(request: NextRequest) {
  if (!validateCronRequest(request)) return cronUnauthorized()

  try {
    const now = new Date()

    // 1. Expirar RetrievalCodes ativos já vencidos
    const expiredCodes = await prisma.retrievalCode.findMany({
      where: { status: RetrievalCodeStatus.ACTIVE, expiresAt: { lte: now } },
      select: { id: true },
    })

    const BATCH_SIZE = 10
    const codeResults: PromiseSettledResult<void>[] = []
    for (let i = 0; i < expiredCodes.length; i += BATCH_SIZE) {
      const batch = expiredCodes.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(({ id }) => retrievalService.expireCode(id))
      )
      codeResults.push(...batchResults)
    }
    const codesExpired = codeResults.filter((r) => r.status === 'fulfilled').length
    const codesFailed = codeResults.filter((r) => r.status === 'rejected').length
    if (codesFailed > 0) {
      logger.warn({ codesFailed }, 'cron:expire-donations:partial-failures')
    }

    // 2. Expirar Donations fora da janela de retirada
    const expiredDonations = await prisma.donation.updateMany({
      where: { windowEnd: { lte: now }, status: DonationStatus.AVAILABLE },
      data: { status: DonationStatus.EXPIRED },
    })

    const result = {
      processedCodes: expiredCodes.length,
      codesExpired,
      codesFailed,
      expiredDonations: expiredDonations.count,
    }
    logger.info(result, 'cron:expire-donations')
    return Response.json({ ok: true, ...result })
  } catch (err) {
    logger.error({ err }, 'cron:expire-donations:error')
    return Response.json({ ok: false, error: 'CRON_FAILURE' }, { status: 500 })
  }
}
