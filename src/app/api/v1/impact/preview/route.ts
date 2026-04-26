/**
 * GET /api/v1/impact/preview
 * Retorna métricas de impacto estimadas (preview pré-module-19).
 * Calcula contagens reais de RetrievalCode confirmados.
 * @see module-11-corrente-bem/TASK-0/ST001
 * @see module-19-metricas-impacto (consolidação futura)
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [refeicoesHoje, refeicoesEsteMes, refeicoesTotais] = await Promise.all([
      prisma.retrievalCode.count({
        where: {
          status: 'CONFIRMED',
          confirmedAt: { gte: startOfDay },
        },
      }),
      prisma.retrievalCode.count({
        where: {
          status: 'CONFIRMED',
          confirmedAt: { gte: startOfMonth },
        },
      }),
      prisma.retrievalCode.count({
        where: { status: 'CONFIRMED' },
      }),
    ])

    return NextResponse.json(
      { refeicoesHoje, refeicoesEsteMes, refeicoesTotais },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch {
    // Fallback silencioso — corrente do bem não deve quebrar por falha de métricas
    return NextResponse.json(
      { refeicoesHoje: 0, refeicoesEsteMes: 0, refeicoesTotais: 0 },
      { status: 200 }
    )
  }
}
