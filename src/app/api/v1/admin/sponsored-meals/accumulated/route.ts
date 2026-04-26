/**
 * GET /api/v1/admin/sponsored-meals/accumulated
 * Lista marmitarias com créditos SponsoredMeal AVAILABLE há mais de 30 dias.
 * Agrupado por marmitaria, filtrado por min_credits.
 * @see module-16-admin-gestao/TASK-5/ST002
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'
import { SponsoredMealStatus } from '@/types/enums'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url)
  const minCredits = parseInt(searchParams.get('min_credits') ?? '1', 10)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10))

  try {
    const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS)

    // Buscar SponsoredMeals AVAILABLE criados há mais de 30 dias com marmitariaId
    const meals = await prisma.sponsoredMeal.findMany({
      where: {
        status: SponsoredMealStatus.AVAILABLE,
        createdAt: { lt: thirtyDaysAgo },
        marmitariaId: { not: null },
      },
      select: {
        marmitariaId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    // Agrupar por marmitariaId
    const grouped = new Map<
      string,
      { count: number; oldest: Date }
    >()

    for (const meal of meals) {
      if (!meal.marmitariaId) continue
      const existing = grouped.get(meal.marmitariaId)
      if (!existing) {
        grouped.set(meal.marmitariaId, { count: 1, oldest: meal.createdAt })
      } else {
        existing.count++
        if (meal.createdAt < existing.oldest) existing.oldest = meal.createdAt
      }
    }

    // Filtrar por min_credits
    const filtered = Array.from(grouped.entries()).filter(
      ([, v]) => v.count >= minCredits
    )

    // Ordenar por dias acumulados desc
    filtered.sort((a, b) => a[1].oldest.getTime() - b[1].oldest.getTime())

    const totalCreditos = filtered.reduce((sum, [, v]) => sum + v.count, 0)
    const paginated = filtered.slice((page - 1) * limit, page * limit)

    // Buscar nomes das marmitarias
    const marmitariaIds = paginated.map(([id]) => id)
    const profiles = await prisma.marmitariaProfile.findMany({
      where: { id: { in: marmitariaIds } },
      select: { id: true, tradeName: true, userId: true },
    })
    const profileMap = new Map(profiles.map((p) => [p.id, p]))

    const now = Date.now()
    const data = paginated.map(([marmitariaId, { count, oldest }]) => {
      const profile = profileMap.get(marmitariaId)
      const diasAcumulados = Math.floor((now - oldest.getTime()) / (24 * 60 * 60 * 1000))
      return {
        marmitariaId,
        marmitariaNome: profile?.tradeName ?? marmitariaId,
        totalCreditos: count,
        creditoMaisAntigoEm: oldest.toISOString(),
        diasAcumulados,
      }
    })

    return NextResponse.json({
      data,
      totalCreditos,
      total: filtered.length,
      page,
      limit,
    })
  } catch (error) {
    console.error('[admin/sponsored-meals/accumulated] erro:', error)
    return NextResponse.json(
      { code: 'SYS_001', message: 'Erro interno ao listar marmitas acumuladas.' },
      { status: 500 }
    )
  }
})
