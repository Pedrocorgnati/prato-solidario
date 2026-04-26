/**
 * POST /api/v1/internal/crons/send-diplomas
 *
 * Cron anual (jan 05:00 UTC): envia diplomas por email para todos os doadores elegíveis.
 * Processa em batches de 10 para respeitar rate limit do Resend.
 * Falhas registradas no AuditLog com action DIPLOMA_EMAIL_FAILED.
 *
 * @see intake-review/TASK-12/ST002
 */

import { type NextRequest } from 'next/server'
import { validateCronRequest, cronUnauthorized } from '@/lib/cron-guard'
import { logger } from '@/lib/logger'
import { diplomaService, sendDiplomaEmail } from '@/services/diploma.service'
import { prisma } from '@/lib/prisma'

const BATCH_SIZE = 10
const EMAIL_DELAY_MS = 100

export async function POST(request: NextRequest) {
  if (!validateCronRequest(request)) return cronUnauthorized()

  const year = new Date().getFullYear() - 1
  logger.info({ year }, 'cron:send-diplomas:start')

  // Buscar todos os usuários com diploma gerado para o ano e email não enviado
  const diplomas = await prisma.diploma.findMany({
    where: {
      year,
      OR: [
        { emailStatus: null },
        { emailStatus: 'pending_email' },
      ],
    },
    select: {
      id: true,
      userId: true,
      signedUrl: true,
      user: {
        select: {
          _count: { select: { donations: { where: { status: 'COMPLETED' } } } },
        },
      },
    },
  })

  if (diplomas.length === 0) {
    logger.info({ year }, 'cron:send-diplomas:no-eligible')
    return Response.json({ ok: true, year, total: 0, sent: 0, failed: 0 })
  }

  let sent = 0
  let failed = 0

  // Processar em batches de 10
  for (let i = 0; i < diplomas.length; i += BATCH_SIZE) {
    const batch = diplomas.slice(i, i + BATCH_SIZE)

    await Promise.allSettled(
      batch.map(async (diploma) => {
        const diplomaUrl = diploma.signedUrl
        if (!diplomaUrl) return

        const totalDonations = diploma.user._count.donations
        const result = await sendDiplomaEmail({
          userId: diploma.userId,
          diplomaUrl,
          year,
          impactSummary: { totalDonations, familiesBenefited: Math.floor(totalDonations * 0.8) },
        })

        if (result.success) {
          sent++
          await prisma.diploma.update({
            where: { id: diploma.id },
            data: { emailStatus: 'sent', emailSentAt: new Date() },
          })
        } else {
          failed++
          await prisma.diploma.update({
            where: { id: diploma.id },
            data: { emailStatus: 'pending_email' },
          })
          try {
            await prisma.auditLog.create({
              data: {
                action: 'DIPLOMA_EMAIL_FAILED',
                entityType: 'Diploma',
                entityId: diploma.id,
                metadata: { userId: diploma.userId, year, error: result.error ?? 'unknown' },
              },
            })
          } catch { /* ignore audit failures */ }
        }
      })
    )

    // Rate limit delay entre batches
    if (i + BATCH_SIZE < diplomas.length) {
      await new Promise((r) => setTimeout(r, EMAIL_DELAY_MS))
    }
  }

  logger.info({ year, total: diplomas.length, sent, failed }, 'cron:send-diplomas:done')
  return Response.json({ ok: true, year, total: diplomas.length, sent, failed, pending: failed })
}
