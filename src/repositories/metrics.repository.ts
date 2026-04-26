/**
 * MetricsRepository — consultas ao banco para métricas de impacto.
 *
 * Índices verificados no schema.prisma:
 *   - IDX_retrieval_codes_status (RetrievalCode.status)
 *   - IDX_donations_status (Donation.status)
 *   - IDX_impact_metrics_calculated_at (ImpactMetrics.calculatedAt)
 *
 * @see module-19-metricas-impacto/TASK-1/ST002
 */

import { prisma } from '@/lib/prisma'
import { METRICS_FACTORS } from '@/lib/constants/metrics'
import type { MetricsHistoryEntry, TopDonor } from '@/types/metrics.types'

export class MetricsRepository {
  /**
   * Agrega métricas em tempo real diretamente do banco.
   * Executa 4 queries em paralelo — target < 200ms com índices.
   */
  async getRealtimeMetrics(): Promise<{
    totalMealsDistributed: number
    activeDonationsToday: number
    activeMarmitarias: number
    totalUsers: number
  }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [mealsResult, activeDonations, activeMarmitarias, totalUsers] = await Promise.all([
      // SUM de porções de refeições com código de retirada CONFIRMED
      prisma.retrievalCode.aggregate({
        _sum: { portions: true },
        where: { status: 'CONFIRMED' },
      }),
      // Doações disponíveis hoje
      prisma.donation.count({
        where: {
          status: 'AVAILABLE',
          createdAt: { gte: today },
        },
      }),
      // Marmitarias ativas
      prisma.marmitariaProfile.count({
        where: { status: 'ACTIVE' },
      }),
      // Usuários ativos não deletados
      prisma.user.count({
        where: {
          isActive: true,
          deletedAt: null,
        },
      }),
    ])

    return {
      totalMealsDistributed: mealsResult._sum.portions ?? 0,
      activeDonationsToday: activeDonations,
      activeMarmitarias,
      totalUsers,
    }
  }

  /**
   * Persiste snapshot diário no modelo ImpactMetrics.
   * Chamado pelo cron module-23 (calculate-metrics).
   * Mapeia campos calculados para o schema real do banco.
   */
  async saveSnapshot(metrics: {
    totalMealsDistributed: number
    activeMarmitarias: number
    totalUsers: number
  }): Promise<void> {
    // Agrega contagens adicionais necessárias para preencher o schema
    const [totalDonations, totalReceptors, totalDonors, totalSponsored] = await Promise.all([
      prisma.donation.count(),
      prisma.user.count({
        where: { role: 'RECEPTOR', isActive: true, deletedAt: null },
      }),
      prisma.user.count({
        where: {
          role: { in: ['DOADOR_PF', 'DOADOR_RESTAURANTE'] },
          isActive: true,
          deletedAt: null,
        },
      }),
      prisma.sponsoredMeal.count(),
    ])

    await prisma.impactMetrics.create({
      data: {
        totalDonations,
        totalPortions: metrics.totalMealsDistributed,
        totalReceptors,
        totalDonors,
        totalMarmitarias: metrics.activeMarmitarias,
        totalSponsored,
        // calculatedAt: default(now()) — não precisa passar
      },
    })
  }

  /**
   * Histórico de snapshots dos últimos N dias para gráfico de evolução.
   * Nota: kgFoodSaved e kgCO2Avoided são computados a partir de totalPortions
   * (não persistidos no schema atual).
   */
  async getHistory(days: number): Promise<MetricsHistoryEntry[]> {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const rows = await prisma.impactMetrics.findMany({
      where: { calculatedAt: { gte: since } },
      orderBy: { calculatedAt: 'asc' },
      select: {
        calculatedAt: true,
        totalPortions: true,
      },
    })

    return rows.map((row) => {
      const kgFoodSaved = row.totalPortions * METRICS_FACTORS.KG_PER_MEAL
      return {
        snapshotAt: row.calculatedAt,
        totalMealsDistributed: row.totalPortions,
        kgFoodSaved,
        kgCO2Avoided: kgFoodSaved * METRICS_FACTORS.CO2_FACTOR_IPCC,
      }
    })
  }

  /**
   * Top doadores por total de porções confirmadas.
   * Usa raw query para JOIN RetrievalCode → Donation (donorId não está em RC).
   * NOTA: campo hallOfFame não existe no schema atual — lista todos os doadores ativos.
   * Pendente: adicionar hallOfFame à tabela users antes do go-live (PENDING-ACTIONS).
   */
  async getTopDonors(limit = 10): Promise<TopDonor[]> {
    const aggregates = await prisma.$queryRaw<
      { donorId: string; totalMeals: bigint }[]
    >`
      SELECT d.donor_id AS "donorId", COALESCE(SUM(rc.portions), 0)::bigint AS "totalMeals"
      FROM retrieval_codes rc
      JOIN donations d ON rc.donation_id = d.id
      WHERE rc.status = 'CONFIRMED'
      GROUP BY d.donor_id
      ORDER BY "totalMeals" DESC
      LIMIT ${limit}
    `

    if (aggregates.length === 0) return []

    const donorIds = aggregates.map((a) => a.donorId)

    const users = await prisma.user.findMany({
      where: {
        id: { in: donorIds },
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        addresses: {
          where: { isPrimary: true },
          select: { cidade: true },
          take: 1,
        },
      },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))

    const results: TopDonor[] = []
    let rank = 1
    for (const agg of aggregates) {
      const user = userMap.get(agg.donorId)
      if (!user) continue
      results.push({
        userId: user.id,
        displayName: user.name ?? 'Doador Anônimo',
        avatarUrl: user.photoUrl ?? null,
        city: user.addresses[0]?.cidade ?? 'Não informado',
        totalMeals: Number(agg.totalMeals),
        rank: rank++,
      })
    }

    return results
  }
}

export const metricsRepository = new MetricsRepository()
