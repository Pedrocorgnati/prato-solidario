/**
 * GET /api/v1/admin/marmitarias
 * Lista marmitarias com filtro por status e paginação.
 * @see module-16-admin-gestao/TASK-2/ST001
 */

import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'
import type { AdminMarmitariaListItem } from '@/types/admin-gestao'

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? undefined
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10))
  const skip = (page - 1) * limit

  try {
    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [marmitarias, total] = await Promise.all([
      prisma.marmitariaProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          tradeName: true,
          cnpj: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.marmitariaProfile.count({ where }),
    ])

    const data: AdminMarmitariaListItem[] = marmitarias.map((m) => ({
      id: m.id,
      ownerId: m.user.id,
      ownerName: m.user.name,
      ownerEmail: m.user.email,
      tradeName: m.tradeName,
      cnpj: m.cnpj ?? '',
      status: m.status as AdminMarmitariaListItem['status'],
      createdAt: m.createdAt.toISOString(),
    }))

    return NextResponse.json({ data, total, page, limit })
  } catch (error) {
    console.error('[admin/marmitarias] erro ao listar:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno ao listar marmitarias.' },
      { status: 500 }
    )
  }
})
