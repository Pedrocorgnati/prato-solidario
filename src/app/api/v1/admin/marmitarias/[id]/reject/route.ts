/**
 * POST /api/v1/admin/marmitarias/{id}/reject
 * Rejeita marmitaria (PENDING_APPROVAL → status mantido, rejectReason em metadata).
 * Requer motivo (min 20, max 1000 chars).
 * @see module-16-admin-gestao/TASK-2/ST004
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'
import { adminRepository } from '@/repositories/admin.repository'
import { AdminActionType, MarmitariaStatus } from '@/types/enums'
import { expoPushService } from '@/services/expo-push.service'

const bodySchema = z.object({
  motivo: z
    .string()
    .min(20, 'Motivo deve ter ao menos 20 caracteres.')
    .max(1000),
})

export const POST = withAdmin<{ id: string }>(async (req, { params, adminId }) => {
  const { id: marmitariaId } = params

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json(
      { code: 'VAL_001', message: 'Motivo obrigatório (mínimo 20 caracteres).' },
      { status: 400 }
    )
  }

  try {
    const profile = await prisma.marmitariaProfile.findUnique({
      where: { id: marmitariaId },
      include: { user: { select: { id: true, email: true, name: true } } },
    })

    if (!profile) {
      return NextResponse.json(
        { code: 'MARMITARIA_001', message: 'Marmitaria não encontrada.' },
        { status: 404 }
      )
    }

    if (profile.status !== MarmitariaStatus.PENDING_APPROVAL) {
      return NextResponse.json(
        { code: 'VAL_050', message: 'Marmitaria não está em PENDING_APPROVAL.' },
        { status: 422 }
      )
    }

    // Transação atômica: marcar como INACTIVE (rejeição) + AdminAction + AuditLog
    // Nota: schema não tem campo rejectReason — motivo salvo em AdminAction.metadata
    await prisma.$transaction(async () => {
      await prisma.marmitariaProfile.update({
        where: { id: marmitariaId },
        data: { status: MarmitariaStatus.INACTIVE },
      })

      await adminRepository.createAdminActionWithAudit({
        adminId,
        type: AdminActionType.REJECT,
        targetId: marmitariaId,
        targetType: 'MarmitariaProfile',
        reason: body.motivo,
        metadata: {
          action: 'REJECT_MARMITARIA',
          tradeName: profile.tradeName,
          rejectReason: body.motivo,
        },
      })
    })

    // Push notification ao owner (fora da transação)
    try {
      const tokens = await prisma.pushToken.findMany({
        where: { userId: profile.userId },
        select: { token: true },
      })
      if (tokens.length > 0) {
        await expoPushService.sendBatch(
          tokens.map((t) => ({
            to: t.token,
            title: 'Cadastro não aprovado',
            body: `O cadastro de "${profile.tradeName}" não foi aprovado. Verifique o motivo e tente novamente.`,
            data: { action: 'VIEW_REJECTION', marmitariaId, motivo: body.motivo },
          }))
        )
      }
    } catch (notifErr) {
      console.warn('[admin/marmitarias/reject] falha ao enviar notificação:', notifErr)
    }

    return NextResponse.json({
      success: true,
      marmitaria: { id: marmitariaId, status: MarmitariaStatus.INACTIVE },
    })
  } catch (error) {
    console.error('[admin/marmitarias/reject] erro:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno ao rejeitar marmitaria.' },
      { status: 500 }
    )
  }
})
