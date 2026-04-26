/**
 * GET  /api/v1/admin/diplomas/pending  — lista diplomas com emailStatus pending_email
 * POST /api/v1/admin/diplomas/pending/retry — re-envia emails para diploma IDs especificados
 *
 * Ambas protegidas por role ADMIN.
 * @see intake-review/TASK-12/ST003
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { sendDiplomaEmail } from '@/services/diploma.service'

const MAX_RETRY_ATTEMPTS = 3

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'AUTH_001', message: 'Não autenticado.' }, { status: 401 })
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'AUTH_003', message: 'Acesso negado.' }, { status: 403 })

  const diplomas = await prisma.diploma.findMany({
    where: { emailStatus: 'pending_email' },
    select: {
      id: true,
      userId: true,
      year: true,
      emailStatus: true,
      emailRetryCount: true,
      signedUrl: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ diplomas })
}

const retrySchema = z.object({
  diplomaIds: z.array(z.string().uuid()).min(1).max(50),
})

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'AUTH_001', message: 'Não autenticado.' }, { status: 401 })
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'AUTH_003', message: 'Acesso negado.' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const parsed = retrySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VAL_001', message: 'diplomaIds inválido.' }, { status: 400 })
  }

  const { diplomaIds } = parsed.data

  const diplomas = await prisma.diploma.findMany({
    where: { id: { in: diplomaIds }, emailStatus: 'pending_email' },
    select: { id: true, userId: true, year: true, signedUrl: true, emailRetryCount: true },
  })

  const results = await Promise.allSettled(
    diplomas.map(async (diploma) => {
      if ((diploma.emailRetryCount ?? 0) >= MAX_RETRY_ATTEMPTS) {
        return { id: diploma.id, status: 'max_retries_reached' }
      }

      const result = await sendDiplomaEmail({
        userId: diploma.userId,
        diplomaUrl: diploma.signedUrl ?? '',
        year: diploma.year,
      })

      await prisma.diploma.update({
        where: { id: diploma.id },
        data: {
          emailStatus: result.success ? 'sent' : 'pending_email',
          emailRetryCount: { increment: 1 },
          ...(result.success ? { emailSentAt: new Date() } : {}),
        },
      })

      return { id: diploma.id, status: result.success ? 'sent' : 'failed', error: result.error }
    })
  )

  const summary = results.map((r) => (r.status === 'fulfilled' ? r.value : { status: 'error' }))
  const sent = summary.filter((s) => s.status === 'sent').length
  const failed = summary.filter((s) => s.status === 'failed' || s.status === 'error').length

  return NextResponse.json({ total: diplomaIds.length, sent, failed, results: summary })
}
