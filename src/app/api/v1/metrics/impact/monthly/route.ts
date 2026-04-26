/**
 * GET /api/v1/metrics/impact/monthly?userId=X
 * Retorna breakdown mensal de impacto dos últimos 7 meses (atual + 6 anteriores).
 *
 * - Autenticado: session obrigatória (receptor pode ver próprio impacto)
 * - Permite userId diferente apenas para ADMIN
 * - Resposta: array de 7 meses com mealsThisMonth, kgFoodSaved, kgCO2Avoided
 *
 * @see intake-review/TASK-16/ST001
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth/session'
import { calcKgFoodSaved, calcKgCO2Avoided } from '@/lib/constants/impact'

export interface MonthlyImpactEntry {
  month: number
  year: number
  label: string
  mealsThisMonth: number
  kgFoodSaved: number
  kgCO2Avoided: number
}

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json(
      { error: 'AUTH_001', message: 'Autenticação necessária.' },
      { status: 401 },
    )
  }

  // Determinar userId alvo
  const qUserId = req.nextUrl.searchParams.get('userId')
  let targetUserId: string

  if (qUserId && qUserId !== session.id) {
    if ((session.role as string) !== 'ADMIN') {
      return NextResponse.json(
        { error: 'AUTH_003', message: 'Acesso negado.' },
        { status: 403 },
      )
    }
    targetUserId = qUserId
  } else {
    targetUserId = session.id
  }

  // Calcular os últimos 7 meses (atual + 6 anteriores)
  const now = new Date()
  const months: Array<{ month: number; year: number }> = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ month: d.getMonth() + 1, year: d.getFullYear() })
  }

  // Query: busca refeições confirmadas agrupadas por mês/ano
  const results = await prisma.$queryRaw<
    Array<{ month: number; year: number; total_meals: bigint }>
  >`
    SELECT
      EXTRACT(MONTH FROM rc.updated_at)::int AS month,
      EXTRACT(YEAR FROM rc.updated_at)::int AS year,
      COALESCE(SUM(rc.portions), 0)::bigint AS total_meals
    FROM retrieval_codes rc
    JOIN donations d ON rc.donation_id = d.id
    WHERE rc.status = 'CONFIRMED'
      AND d.donor_id = ${targetUserId}
      AND rc.updated_at >= ${new Date(now.getFullYear(), now.getMonth() - 6, 1)}
    GROUP BY EXTRACT(YEAR FROM rc.updated_at), EXTRACT(MONTH FROM rc.updated_at)
    ORDER BY year ASC, month ASC
  `

  // Montar mapa para lookup rápido
  const resultMap = new Map<string, number>()
  for (const row of results) {
    resultMap.set(`${row.year}-${row.month}`, Number(row.total_meals))
  }

  // Combinar com lista de meses (incluindo zeros)
  const data: MonthlyImpactEntry[] = months.map(({ month, year }) => {
    const meals = resultMap.get(`${year}-${month}`) ?? 0
    return {
      month,
      year,
      label: `${MONTH_LABELS[month - 1]}/${String(year).slice(2)}`,
      mealsThisMonth: meals,
      kgFoodSaved: calcKgFoodSaved(meals),
      kgCO2Avoided: calcKgCO2Avoided(meals),
    }
  })

  return NextResponse.json(
    { data },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    },
  )
}
