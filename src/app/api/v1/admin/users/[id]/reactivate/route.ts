/**
 * POST /api/v1/admin/users/{id}/reactivate
 * Reativa usuário suspenso (isActive = true) e registra AdminAction.
 * Requer motivo (min 10 chars).
 * @see module-16-admin-gestao/TASK-1/ST004
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
  const { id: userId } = params

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
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { code: 'USER_001', message: 'Usuário não encontrado.' },
        { status: 404 }
      )
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    })

    await adminRepository.createAdminActionWithAudit({
      adminId,
      type: AdminActionType.UNBLOCK,
      targetId: userId,
      targetType: 'User',
      reason: body.motivo,
      metadata: { action: 'REACTIVATE_USER' },
    })

    return NextResponse.json({ success: true, action: 'REACTIVATE_USER' })
  } catch (error) {
    console.error('[admin/users/reactivate] erro:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno ao reativar usuário.' },
      { status: 500 }
    )
  }
})
