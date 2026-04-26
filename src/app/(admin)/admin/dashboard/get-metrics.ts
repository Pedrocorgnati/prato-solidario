import { prisma } from '@/lib/prisma'
import { DonationStatus, MarmitariaStatus, BannerStatus } from '@/types/enums'

export interface AdminMetrics {
  doacoesHoje: number
  refeicoesSemana: number
  marmitariasAtivas: number
  bannersAtivos: number
  receitaBannersMes: number
  usuariosCadastrados: number
  doacoesPorDia: { date: string; count: number }[]
}

/**
 * Busca métricas agregadas para o dashboard admin.
 * Reutiliza a mesma lógica da API route GET /api/v1/admin/metrics.
 * Chamado diretamente pelo Server Component (page.tsx).
 */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    doacoesHoje,
    refeicoesResult,
    marmitariasAtivas,
    bannersAtivos,
    receitaResult,
    usuariosCadastrados,
    doacoesPorDiaRaw,
  ] = await Promise.all([
    prisma.donation.count({
      where: { createdAt: { gte: startOfDay } },
    }),
    prisma.donation.aggregate({
      _sum: { portions: true },
      where: {
        status: DonationStatus.COMPLETED,
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.marmitariaProfile.count({
      where: { status: MarmitariaStatus.ACTIVE },
    }),
    prisma.bannerCampaign.count({
      where: { status: BannerStatus.ACTIVE },
    }),
    prisma.sponsorPurchase.aggregate({
      _sum: { totalAmount: true },
      where: {
        paymentStatus: 'APPROVED',
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.user.count(),
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT
        TO_CHAR(
          DATE_TRUNC('day', created_at AT TIME ZONE 'America/Sao_Paulo'),
          'YYYY-MM-DD'
        ) AS date,
        COUNT(*)::bigint AS count
      FROM donations
      WHERE created_at >= ${sevenDaysAgo}
      GROUP BY DATE_TRUNC('day', created_at AT TIME ZONE 'America/Sao_Paulo')
      ORDER BY 1 ASC
    `,
  ])

  const doacoesPorDia = buildDailyArray(sevenDaysAgo, doacoesPorDiaRaw)

  return {
    doacoesHoje,
    refeicoesSemana: refeicoesResult._sum.portions ?? 0,
    marmitariasAtivas,
    bannersAtivos,
    receitaBannersMes: Math.round(Number(receitaResult._sum.totalAmount ?? 0) * 100),
    usuariosCadastrados,
    doacoesPorDia,
  }
}

function buildDailyArray(
  since: Date,
  raw: { date: string; count: bigint }[]
): { date: string; count: number }[] {
  const map = new Map(raw.map((r) => [r.date, Number(r.count)]))
  const result: { date: string; count: number }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(since)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    result.push({ date: key, count: map.get(key) ?? 0 })
  }
  return result
}
