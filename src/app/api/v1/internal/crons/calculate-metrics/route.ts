/**
 * POST /api/v1/internal/crons/calculate-metrics
 *
 * Cron a cada 15min: calcula métricas em tempo real e persiste snapshot
 * no banco de dados. Idempotente (cada execução cria novo snapshot).
 *
 * @see module-23-crons-jobs/TASK-3/ST001
 */

import { type NextRequest } from 'next/server'
import { validateCronRequest, cronUnauthorized } from '@/lib/cron-guard'
import { logger } from '@/lib/logger'
import { metricsService } from '@/services/metrics.service'

export async function POST(request: NextRequest) {
  if (!validateCronRequest(request)) return cronUnauthorized()

  try {
    // Calcular métricas em tempo real para logar antes de salvar
    const snapshot = await metricsService.calculateRealtimeMetrics()
    await metricsService.saveMetricsSnapshot()

    logger.info({ snapshot }, 'cron:calculate-metrics')
    return Response.json({ ok: true, snapshot })
  } catch (err) {
    logger.error({ err }, 'cron:calculate-metrics:error')
    return Response.json({ ok: false, error: 'CRON_FAILURE' }, { status: 500 })
  }
}
