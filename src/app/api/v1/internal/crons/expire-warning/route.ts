/**
 * POST /api/v1/internal/crons/expire-warning
 *
 * Cron a cada 5min: envia aviso de expiração para RetrievalCodes que
 * vencem em até 1h. Idempotente via warningSentAt (sem spam de notificação).
 *
 * @see module-23-crons-jobs/TASK-2/ST001
 */

import { type NextRequest } from 'next/server'
import { validateCronRequest, cronUnauthorized } from '@/lib/cron-guard'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/services/notification.service'
import { RetrievalCodeStatus } from '@/types/enums'

export async function POST(request: NextRequest) {
  if (!validateCronRequest(request)) return cronUnauthorized()

  try {
    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

    // Buscar códigos ativos que expiram em até 1h e aviso ainda não enviado
    const codes = await prisma.retrievalCode.findMany({
      where: {
        status: RetrievalCodeStatus.ACTIVE,
        expiresAt: { gte: now, lte: oneHourLater },
        warningSentAt: null,
      },
      select: { id: true },
    })

    let warned = 0
    let failed = 0
    for (const { id } of codes) {
      try {
        await notificationService.sendExpirationWarning(id)
        await prisma.retrievalCode.update({
          where: { id },
          data: { warningSentAt: new Date() },
        })
        warned++
      } catch (err) {
        failed++
        logger.error({ codeId: id, err }, 'cron:expire-warning:item-failed')
      }
    }

    logger.info({ warned, failed }, 'cron:expire-warning')
    return Response.json({ ok: true, warned, failed })
  } catch (err) {
    logger.error({ err }, 'cron:expire-warning:error')
    return Response.json({ ok: false, error: 'CRON_FAILURE' }, { status: 500 })
  }
}
