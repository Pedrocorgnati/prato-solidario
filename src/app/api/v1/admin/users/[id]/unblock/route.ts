/**
 * POST /api/v1/admin/users/{id}/unblock
 * Desbloqueia receptor no AbuseService e registra AdminAction.
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
  reason: z.string()
    .min(20, 'Justificativa deve ter no mínimo 20 caracteres')
    .max(500, 'Justificativa deve ter no máximo 500 caracteres'),
})

export const POST = withAdmin<{ id: string }>(async (req, { params, adminId }) => {
  const { id: userId } = params

  const rawBody = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors.reason?.[0] ?? 'Dados inválidos' },
      { status: 400 }
    )
  }
  const { reason } = parsed.data

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { code: 'USER_001', message: 'Usuário não encontrado.' },
        { status: 404 }
      )
    }

    // Desbloquear todos os registros de abuso ativos
    await prisma.abuseRecord.updateMany({
      where: {
        userId,
        blockedUntil: { gt: new Date() },
      },
      data: { blockedUntil: new Date() }, // expirar imediatamente
    })

    // Registrar AdminAction
    await adminRepository.createAdminActionWithAudit({
      adminId,
      type: AdminActionType.UNBLOCK,
      targetId: userId,
      targetType: 'User',
      reason,
      metadata: { action: 'UNBLOCK_RECEPTOR' },
    })

    // Registrar AuditLog — ST002
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'USER_UNBLOCKED',
        entityType: 'User',
        entityId: userId,
        metadata: { reason, unblockedBy: adminId },
        ipAddress: req.headers.get('x-forwarded-for') ?? 'unknown',
      },
    })

    return NextResponse.json({ success: true, action: 'UNBLOCK' })
  } catch (error) {
    console.error('[admin/users/unblock] erro:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno ao desbloquear usuário.' },
      { status: 500 }
    )
  }
})
