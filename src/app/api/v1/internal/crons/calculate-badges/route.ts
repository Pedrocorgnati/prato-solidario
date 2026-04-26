/**
 * POST /api/v1/internal/crons/calculate-badges
 *
 * Cron mensal (1º dia do mês 02:00 UTC): atribui badges para o mês anterior.
 * Idempotente — processMonthlyCycle não duplica badges já atribuídos.
 *
 * Rastreabilidade INTAKE: INT-125
 * @see module-23-crons-jobs/TASK-3/ST002
 */

import { type NextRequest } from 'next/server'
import { validateCronRequest, cronUnauthorized } from '@/lib/cron-guard'
import { logger } from '@/lib/logger'
import { gamificationService } from '@/services/gamification.service'

export async function POST(request: NextRequest) {
  if (!validateCronRequest(request)) return cronUnauthorized()

  try {
    // Calcular para o mês anterior (getMonth() retorna 0-based)
    const now = new Date()
    const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth() // 1-based
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

    const result = await gamificationService.processMonthlyCycle(lastMonth, year)

    logger.info(
      { badgesAwarded: result.badgesAwarded, usersProcessed: result.processed, month: lastMonth, year },
      'cron:calculate-badges'
    )
    return Response.json({ ok: true, badgesAwarded: result.badgesAwarded, usersProcessed: result.processed, month: lastMonth, year })
  } catch (err) {
    logger.error({ err }, 'cron:calculate-badges:error')
    return Response.json({ ok: false, error: 'CRON_FAILURE' }, { status: 500 })
  }
}
