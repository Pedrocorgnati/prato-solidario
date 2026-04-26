/**
 * POST /api/v1/admin/sponsored-meals/notify
 * Notifica marmitarias sobre créditos acumulados.
 * @see module-16-admin-gestao/TASK-5/ST003
 */

import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bodySchema = z.object({
  marmitariaIds: z.array(z.string().uuid()).min(1).max(100),
})

export const POST = withAdmin(async (req) => {
  try {
    const body = await req.json()
    const parsed = bodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { code: 'VAL_001', message: 'marmitariaIds inválido.' },
        { status: 400 }
      )
    }

    const { marmitariaIds } = parsed.data
    const results = await Promise.allSettled(
      marmitariaIds.map(async (marmitariaId) => {
        const marmitaria = await prisma.marmitariaProfile.findUnique({
          where: { id: marmitariaId },
          select: {
            id: true,
            tradeName: true,
            user: { select: { id: true, email: true, name: true } },
          },
        })

        if (!marmitaria) {
          throw new Error(`Marmitaria ${marmitariaId} não encontrada`)
        }

        if (!marmitaria.user.email) {
          throw new Error(`Marmitaria ${marmitariaId}: email não configurado`)
        }

        // Registrar AdminAction
        await prisma.auditLog.create({
          data: {
            action: 'NOTIFY_MARMITARIA_ACCUMULATED',
            entityType: 'MARMITARIA',
            entityId: marmitariaId,
            metadata: {
              marmitariaNome: marmitaria.tradeName,
              notifiedEmail: marmitaria.user.email,
            },
          },
        })

        return { marmitariaId, email: marmitaria.user.email }
      })
    )

    const notified = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length
    const errors = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => String(r.reason?.message ?? r.reason))

    const status = failed > 0 && notified > 0 ? 207 : failed > 0 ? 500 : 200

    return NextResponse.json({ notified, failed, errors: errors.length > 0 ? errors : undefined }, { status })
  } catch (error) {
    console.error('[admin/sponsored-meals/notify] erro:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno.' },
      { status: 500 }
    )
  }
})
