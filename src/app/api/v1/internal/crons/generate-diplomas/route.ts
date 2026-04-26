/**
 * POST /api/v1/internal/crons/generate-diplomas
 *
 * Cron anual (1 jan 03:00 UTC): gera diplomas PDF para o ano anterior.
 * Idempotente — DiplomaService pula usuários com diploma já gerado.
 *
 * Prioridade: Could. Vercel Hobby tem timeout de 60s; Pro tem 300s.
 * DiplomaService processa internamente em batches de 50.
 *
 * Rastreabilidade INTAKE: INT-126
 * @see module-23-crons-jobs/TASK-5/ST001
 */

import { type NextRequest } from 'next/server'
import { validateCronRequest, cronUnauthorized } from '@/lib/cron-guard'
import { logger } from '@/lib/logger'
import { diplomaService } from '@/services/diploma.service'

export async function POST(request: NextRequest) {
  if (!validateCronRequest(request)) return cronUnauthorized()

  const lastYear = new Date().getFullYear() - 1
  logger.info({ lastYear }, 'cron:generate-diplomas:start')

  try {
    const result = await diplomaService.generateAllYearDiplomas(lastYear)

    logger.info(
      { lastYear, diplomasGenerated: result.generated, skipped: result.skipped, failed: result.errors.length },
      'cron:generate-diplomas:done'
    )
    return Response.json({ ok: true, lastYear, ...result })
  } catch (err) {
    // Timeout do Vercel (60s Hobby / 300s Pro) — logar e retornar erro
    logger.error({ lastYear, err }, 'cron:generate-diplomas:error')
    return Response.json({ ok: false, lastYear, error: 'TIMEOUT_OR_FAILURE' }, { status: 500 })
  }
}
