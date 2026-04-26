/**
 * POST /api/v1/admin/partners/{id}/verify
 * Verifica ou revoga verificação de ONG.
 * body: { acao: "VERIFY" | "REVOKE", motivo: string }
 * @see module-16-admin-gestao/TASK-4/ST003
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'
import { adminRepository } from '@/repositories/admin.repository'
import { AdminActionType } from '@/types/enums'

const bodySchema = z.object({
  acao: z.enum(['VERIFY', 'REVOKE']),
  motivo: z.string().min(10, 'Motivo deve ter ao menos 10 caracteres.').max(500),
})

export const POST = withAdmin<{ id: string }>(async (req, { params, adminId }) => {
  const { id: partnerId } = params

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json(
      { code: 'VAL_001', message: 'Dados inválidos. acao deve ser VERIFY ou REVOKE, motivo obrigatório.' },
      { status: 400 }
    )
  }

  try {
    // Verificar que o parceiro existe (user com role ONG)
    const user = await prisma.user.findFirst({
      where: { id: partnerId, role: 'ONG' },
      include: { ongProfile: { select: { id: true } } },
    })

    if (!user) {
      return NextResponse.json(
        { code: 'PARTNER_001', message: 'Parceiro (ONG) não encontrado.' },
        { status: 404 }
      )
    }

    const actionType = body.acao === 'VERIFY' ? AdminActionType.APPROVE : AdminActionType.REJECT
    const actionLabel = body.acao === 'VERIFY' ? 'VERIFY_PARTNER' : 'REVOKE_PARTNER_VERIFICATION'

    // OngProfile não tem campo isVerified — estado armazenado em AdminAction.metadata
    await adminRepository.createAdminActionWithAudit({
      adminId,
      type: actionType,
      targetId: partnerId,
      targetType: 'OngProfile',
      reason: body.motivo,
      metadata: {
        action: actionLabel,
        isVerified: body.acao === 'VERIFY',
        ongProfileId: user.ongProfile?.id,
      },
    })

    return NextResponse.json({
      success: true,
      action: actionLabel,
      isVerified: body.acao === 'VERIFY',
    })
  } catch (error) {
    console.error('[admin/partners/verify] erro:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno ao verificar parceiro.' },
      { status: 500 }
    )
  }
})
