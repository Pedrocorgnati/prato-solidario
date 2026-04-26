/**
 * POST /api/v1/admin/marmitarias/{id}/approve
 * Aprova marmitaria (PENDING_APPROVAL → ACTIVE) em transação atômica.
 * Registra AdminAction + dispara notificação ao owner.
 * @see module-16-admin-gestao/TASK-2/ST003
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'
import { adminRepository } from '@/repositories/admin.repository'
import { AdminActionType, MarmitariaStatus } from '@/types/enums'
import { expoPushService } from '@/services/expo-push.service'

const bodySchema = z.object({
  observacoes: z.string().max(500).optional(),
})

export const POST = withAdmin<{ id: string }>(async (req, { params, adminId }) => {
  const { id: marmitariaId } = params

  let body: z.infer<typeof bodySchema> = {}
  try {
    const raw = await req.json().catch(() => ({}))
    body = bodySchema.parse(raw)
  } catch {
    return NextResponse.json(
      { code: 'VAL_001', message: 'Dados inválidos.' },
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

    // Transação atômica: status + AdminAction + AuditLog
    await prisma.$transaction(async (tx) => {
      await tx.marmitariaProfile.update({
        where: { id: marmitariaId },
        data: { status: MarmitariaStatus.ACTIVE },
      })

      await adminRepository.createAdminActionWithAudit({
        adminId,
        type: AdminActionType.APPROVE,
        targetId: marmitariaId,
        targetType: 'MarmitariaProfile',
        reason: body.observacoes ?? 'Marmitaria aprovada pelo administrador.',
        metadata: { action: 'APPROVE_MARMITARIA', tradeName: profile.tradeName },
      })
    })

    // Disparar push notification in-app (fora da transação — falha não reverte aprovação)
    try {
      const tokens = await prisma.pushToken.findMany({
        where: { userId: profile.userId },
        select: { token: true },
      })
      if (tokens.length > 0) {
        await expoPushService.sendBatch(
          tokens.map((t) => ({
            to: t.token,
            title: 'Marmitaria aprovada!',
            body: `Sua marmitaria "${profile.tradeName}" foi aprovada. Conecte o Mercado Pago para começar.`,
            data: { action: 'CONNECT_MP', marmitariaId },
          }))
        )
      }
    } catch (notifErr) {
      console.warn('[admin/marmitarias/approve] falha ao enviar notificação:', notifErr)
    }

    return NextResponse.json({
      success: true,
      marmitaria: { id: marmitariaId, status: MarmitariaStatus.ACTIVE },
    })
  } catch (error) {
    console.error('[admin/marmitarias/approve] erro:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno ao aprovar marmitaria.' },
      { status: 500 }
    )
  }
})
