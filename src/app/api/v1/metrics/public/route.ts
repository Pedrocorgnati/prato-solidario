/**
 * GET /api/v1/metrics/public
 * Métricas públicas de impacto — sem autenticação.
 *
 * Cache HTTP: public, s-maxage=300, stale-while-revalidate=600 (5 min CDN).
 * Route Handler dinâmico (acessa DB) — sem force-static.
 *
 * Contrato: ImpactMetrics (types/metrics.ts)
 *   - Legacy: totalRefeicoes, doacoesAtivas, marmitariasParceiras, updatedAt
 *   - Expandido: totalUsers, kgFoodSaved, kgCO2Avoided (module-19)
 *
 * @see module-19-metricas-impacto/TASK-2
 * @see Contrato 10 — compatível com ImpactCounter (module-18/TASK-2)
 */

import { NextResponse } from 'next/server'
import { metricsService } from '@/services/metrics.service'
import type { ImpactMetrics } from '@/types/metrics'

// Degraded fallback — estrutura válida com zeros, não quebra o ImpactCounter
const DEGRADED: ImpactMetrics = {
  totalRefeicoes: 0,
  doacoesAtivas: 0,
  marmitariasParceiras: 0,
  updatedAt: null,
  totalUsers: 0,
  kgFoodSaved: 0,
  kgCO2Avoided: 0,
}

export async function GET() {
  try {
    const metrics = await metricsService.calculateRealtimeMetrics()

    const body: ImpactMetrics = {
      // Legacy — compatibilidade com ImpactCounter (module-18)
      totalRefeicoes: metrics.totalMealsDistributed,
      doacoesAtivas: metrics.activeDonationsToday,
      marmitariasParceiras: metrics.activeMarmitarias,
      updatedAt: metrics.lastUpdated.toISOString(),
      // Expandido — module-19 (/impacto page, perfis, gamificação)
      totalUsers: metrics.totalUsers,
      kgFoodSaved: metrics.kgFoodSaved,
      kgCO2Avoided: metrics.kgCO2Avoided,
    }

    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('[GET /api/v1/metrics/public] Erro inesperado:', error)
    // Modo degradado: retorna 200 com zeros para não quebrar o frontend
    return NextResponse.json(DEGRADED, {
      headers: {
        // Cache curto em modo degradado para recuperação rápida
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  }
}
