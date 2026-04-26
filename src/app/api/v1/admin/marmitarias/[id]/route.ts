/**
 * GET /api/v1/admin/marmitarias/[id]
 * Retorna detalhes de uma marmitaria para aprovação/rejeição.
 * @see module-16-admin-gestao/TASK-2/ST002
 */

import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'

export const GET = withAdmin(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  try {
    const marmitaria = await prisma.marmitariaProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    if (!marmitaria) {
      return NextResponse.json(
        { code: 'MARMITARIA_001', message: 'Marmitaria não encontrada.' },
        { status: 404 }
      )
    }

    // Buscar último AdminAction relacionado (para motivo de rejeição)
    const lastAction = await prisma.auditLog.findFirst({
      where: { entityId: id, entityType: 'MARMITARIA' },
      orderBy: { createdAt: 'desc' },
      select: { action: true, metadata: true, createdAt: true },
    })

    return NextResponse.json({
      ...marmitaria,
      createdAt: marmitaria.createdAt.toISOString(),
      updatedAt: marmitaria.updatedAt?.toISOString(),
      lastAction: lastAction
        ? {
            action: lastAction.action,
            metadata: lastAction.metadata,
            createdAt: lastAction.createdAt.toISOString(),
          }
        : null,
    })
  } catch (error) {
    console.error('[admin/marmitarias/[id]] erro:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno.' },
      { status: 500 }
    )
  }
})
