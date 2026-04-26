/**
 * GET /api/v1/admin/activity?limit=20
 * Feed de atividade recente via AuditLog (sem cache — dados em tempo real).
 * Usado por RecentActivity.tsx com polling de 30s.
 * @see module-15-admin-dashboard/TASK-2/ST001
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json(
      { code: 'AUTH_003', message: 'Acesso negado: role ADMIN obrigatório' },
      { status: 403 }
    )
  }

  const { searchParams } = request.nextUrl
  const parsed = querySchema.safeParse({ limit: searchParams.get('limit') ?? 20 })
  const limit = parsed.success ? parsed.data.limit : 20

  try {
    const items = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        userId: true,
        metadata: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('[admin/activity] erro ao buscar AuditLog:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno ao buscar atividade recente' },
      { status: 500 }
    )
  }
}
