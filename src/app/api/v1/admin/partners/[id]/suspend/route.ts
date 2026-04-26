/**
 * POST /api/v1/admin/partners/{id}/suspend
 * Suspende parceiro (ONG ou Patrocinador): isActive = false.
 * Requer motivo (min 10 chars).
 * @see module-16-admin-gestao/TASK-4/ST003
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'
import { adminRepository } from '@/repositories/admin.repository'
import { AdminActionType } from '@/types/enums'

const bodySchema = z.object({
  motivo: z.string().min(10, 'Motivo deve ter ao menos 10 caracteres.').max(500),
})

export const POST = withAdmin<{ id: string }>(async (req, { params, adminId }) => {
  const { id: partnerId } = params

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json(
      { code: 'VAL_001', message: 'Motivo obrigatório (mínimo 10 caracteres).' },
      { status: 400 }
    )
  }

  try {
    // Parceiro pode ser ONG ou PATROCINADOR
    const user = await prisma.user.findFirst({
      where: { id: partnerId, role: { in: ['ONG', 'PATROCINADOR'] } },
    })

    if (!user) {
      return NextResponse.json(
        { code: 'PARTNER_001', message: 'Parceiro não encontrado.' },
        { status: 404 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { code: 'VAL_050', message: 'Parceiro já está suspenso.' },
        { status: 422 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: partnerId },
        data: { isActive: false },
      })

      await adminRepository.createAdminActionWithAudit({
        adminId,
        type: AdminActionType.SUSPEND,
        targetId: partnerId,
        targetType: 'Partner',
        reason: body.motivo,
        metadata: { action: 'SUSPEND_PARTNER', role: user.role },
      })
    })

    return NextResponse.json({ success: true, action: 'SUSPEND_PARTNER' })
  } catch (error) {
    console.error('[admin/partners/suspend] erro:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno ao suspender parceiro.' },
      { status: 500 }
    )
  }
})
