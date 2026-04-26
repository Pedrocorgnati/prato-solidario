/**
 * GamificationService — lógica de negócio para cálculo e atribuição de badges.
 *
 * Critérios de badge (INTAKE INT-125, FEAT-EN-006):
 *   PRIMEIRA_DOACAO:  >= 1 doação confirmada ever
 *   DOADOR_FREQUENTE: >= 4 doações confirmadas no mês
 *   HEROI_DO_MES:     top 3 do mês por refeições doadas
 *   CENTURIAO:        >= 100 refeições acumuladas
 *   MESTRE:           >= 500 refeições acumuladas
 *
 * SEGURANÇA: scores calculados server-side — nunca aceita dados de score do client.
 *
 * @see module-20-gamificacao/TASK-1/ST001
 */

import { BadgeType } from '@/types/enums'
import { gamificationRepository } from '@/repositories/gamification.repository'
import { prisma } from '@/lib/prisma'

// Critérios canônicos — fonte única de verdade
const BADGE_CRITERIA = {
  [BadgeType.PRIMEIRA_DOACAO]: { minDoacoesEver: 1 },
  [BadgeType.DOADOR_FREQUENTE]: { minDoacoesMes: 4 },
  [BadgeType.HEROI_DO_MES]: { topN: 3 },
  [BadgeType.CENTURIAO]: { totalAcumulado: 100 },
  [BadgeType.MESTRE]: { totalAcumulado: 500 },
} as const

// Timeout para operações de métricas (ms)
const METRICS_TIMEOUT_MS = 10_000

// Tamanho de lote para processamento em paralelo no ciclo mensal
// Math.floor(poolSize / 2) onde poolSize ≈ 5 em serverless
const BATCH_SIZE = 10

// Tipo auxiliar para cálculo de score do HEROI_DO_MES
export type DonorScore = {
  userId: string
  cityId?: string
  volume: number      // total de refeições doadas no mês
  consistency: number // fração de semanas com pelo menos 1 doação (0-1)
}

/**
 * Calcula o score do HEROI_DO_MES usando fórmula 60/40:
 *   60% volume (refeições doadas) + 40% consistência (semanas ativas)
 */
export function calculateHeroScore(donor: DonorScore): number {
  return (donor.volume * 0.6) + (donor.consistency * 100 * 0.4)
}

export class GamificationService {
  /**
   * Calcula quais badges um usuário é elegível em um mês/ano.
   * Retorna lista de BadgeType — nunca aceita dados de score externos.
   */
  async calculateBadgesForUser(
    userId: string,
    month: number,
    year: number,
  ): Promise<BadgeType[]> {
    const earned: BadgeType[] = []

    // Executa todas as queries em paralelo com timeout de 10s
    const [totalEver, countMonth, cumulative] = await Promise.all([
      withTimeout(
        gamificationRepository.getTotalDonationsEver(userId),
        METRICS_TIMEOUT_MS,
        0,
      ),
      withTimeout(
        gamificationRepository.getDonationCountForUserInMonth(userId, month, year),
        METRICS_TIMEOUT_MS,
        0,
      ),
      withTimeout(
        gamificationRepository.getCumulativeMealsByUser(userId),
        METRICS_TIMEOUT_MS,
        0,
      ),
    ])

    if (totalEver >= BADGE_CRITERIA[BadgeType.PRIMEIRA_DOACAO].minDoacoesEver) {
      earned.push(BadgeType.PRIMEIRA_DOACAO)
    }

    if (countMonth >= BADGE_CRITERIA[BadgeType.DOADOR_FREQUENTE].minDoacoesMes) {
      earned.push(BadgeType.DOADOR_FREQUENTE)
    }

    if (cumulative >= BADGE_CRITERIA[BadgeType.CENTURIAO].totalAcumulado) {
      earned.push(BadgeType.CENTURIAO)
    }

    if (cumulative >= BADGE_CRITERIA[BadgeType.MESTRE].totalAcumulado) {
      earned.push(BadgeType.MESTRE)
    }

    return earned
  }

  /**
   * Processa o ciclo mensal de badges para todos os doadores ativos.
   * Chamado pelo cron POST /api/v1/internal/crons/badges — idempotente.
   *
   * @returns { processed, badgesAwarded, errors }
   */
  async processMonthlyCycle(
    month: number,
    year: number,
  ): Promise<{ processed: number; badgesAwarded: number; errors: string[] }> {
    const donorIds = await gamificationRepository.getActiveDonorIds()

    // Top 3 do mês para badge HEROI_DO_MES
    const topMonth = await gamificationRepository.getTopDonorsMonth(month, year, BADGE_CRITERIA[BadgeType.HEROI_DO_MES].topN)
    const heroIds = new Set(topMonth.map((d) => d.userId))

    let processed = 0
    let badgesAwarded = 0
    const errors: string[] = []

    // Processa em lotes para evitar sobrecarga da connection pool em serverless
    for (let i = 0; i < donorIds.length; i += BATCH_SIZE) {
      const batch = donorIds.slice(i, i + BATCH_SIZE)
      await Promise.all(
        batch.map(async (userId) => {
          try {
            const eligible = await this.calculateBadgesForUser(userId, month, year)

            // Adicionar HEROI_DO_MES se estiver no top 3
            if (heroIds.has(userId)) {
              eligible.push(BadgeType.HEROI_DO_MES)
            }

            for (const badgeType of eligible) {
              const isMonthly = [BadgeType.DOADOR_FREQUENTE, BadgeType.HEROI_DO_MES].includes(badgeType)
              const alreadyHas = await gamificationRepository.hasUserBadge(
                userId,
                badgeType,
                isMonthly ? month : null,
                year,
              )

              if (!alreadyHas) {
                await gamificationRepository.awardBadge(
                  userId,
                  badgeType,
                  isMonthly ? month : null,
                  year,
                )
                badgesAwarded++
              }
            }

            processed++
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            errors.push(`userId=${userId}: ${msg}`)
            console.warn(`[GamificationService] Erro ao processar userId=${userId}:`, msg)
            // continua para o próximo usuário
          }
        }),
      )
    }

    return { processed, badgesAwarded, errors }
  }

  /**
   * Retorna badges de um usuário enriquecidos com progresso para cada tipo.
   */
  async getBadgesWithProgress(userId: string): Promise<BadgeWithProgress[]> {
    const [earnedBadges, cumulative, lastMonth] = await Promise.all([
      gamificationRepository.getBadgesByUser(userId),
      gamificationRepository.getCumulativeMealsByUser(userId),
      gamificationRepository.getDonationCountForUserInMonth(
        userId,
        new Date().getMonth() + 1,
        new Date().getFullYear(),
      ),
    ])

    const earnedTypes = new Set(earnedBadges.map((b) => b.type as unknown as BadgeType))

    return ALL_BADGE_TYPES.map((type) => {
      const earnedBadge = earnedBadges.find((b) => (b.type as unknown as BadgeType) === type)
      let current = 0
      let target = 1

      switch (type) {
        case BadgeType.PRIMEIRA_DOACAO:
          current = cumulative > 0 ? 1 : 0
          target = 1
          break
        case BadgeType.DOADOR_FREQUENTE:
          current = lastMonth
          target = 4
          break
        case BadgeType.CENTURIAO:
          current = cumulative
          target = 100
          break
        case BadgeType.MESTRE:
          current = cumulative
          target = 500
          break
        case BadgeType.HEROI_DO_MES:
          current = 0
          target = 1
          break
      }

      return {
        type,
        earned: earnedTypes.has(type),
        earnedAt: earnedBadge?.awardedAt ?? null,
        current,
        target,
      }
    })
  }

  /**
   * Retorna top 3 doadores por cidade para um mês/ano.
   * Agrupa por user.city (null → "Sem cidade").
   * @see intake-review/TASK-16/ST003
   */
  async calculateHeroiDoMesByCity(
    month: number,
    year: number,
  ): Promise<Record<string, CityTopDonor[]>> {
    const rows = await prisma.$queryRaw<
      Array<{
        userId: string
        displayName: string | null
        city: string | null
        totalMeals: bigint
      }>
    >`
      SELECT
        d.donor_id AS "userId",
        u.name AS "displayName",
        u.city AS city,
        COALESCE(SUM(rc.portions), 0)::bigint AS "totalMeals"
      FROM retrieval_codes rc
      JOIN donations d ON rc.donation_id = d.id
      JOIN users u ON u.id = d.donor_id
      WHERE rc.status = 'CONFIRMED'
        AND u.hall_of_fame = true
        AND EXTRACT(MONTH FROM rc.updated_at) = ${month}
        AND EXTRACT(YEAR FROM rc.updated_at) = ${year}
      GROUP BY d.donor_id, u.name, u.city
      ORDER BY "totalMeals" DESC
    `

    // Agrupar por cidade
    const cityMap = new Map<string, CityTopDonor[]>()

    for (const row of rows) {
      const city = row.city ?? 'Sem cidade'
      const existing = cityMap.get(city) ?? []

      if (existing.length < 3) {
        existing.push({
          rank: existing.length + 1,
          userId: row.userId,
          displayName: anonymizeName(row.displayName),
          city,
          totalMeals: Number(row.totalMeals),
        })
        cityMap.set(city, existing)
      }
    }

    return Object.fromEntries(cityMap)
  }
}

export interface BadgeWithProgress {
  type: BadgeType
  earned: boolean
  earnedAt: Date | null
  current: number
  target: number
}

const ALL_BADGE_TYPES = [
  BadgeType.PRIMEIRA_DOACAO,
  BadgeType.DOADOR_FREQUENTE,
  BadgeType.HEROI_DO_MES,
  BadgeType.CENTURIAO,
  BadgeType.MESTRE,
]

/**
 * Executa uma promise com timeout. Em caso de timeout, retorna o valor fallback
 * e registra aviso — nunca lança exceção.
 */
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>
  const timeout = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`[GamificationService] Timeout de ${ms}ms atingido — usando fallback`)
      resolve(fallback)
    }, ms)
  })

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId))
}

export const gamificationService = new GamificationService()

export interface CityTopDonor {
  rank: number
  userId: string
  displayName: string
  city: string
  totalMeals: number
}

/** Anonimiza nome: PF → "João S." | PJ → nome como está */
function anonymizeName(name: string | null): string {
  if (!name) return 'Doador Anônimo'
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 1) return parts[0]
  const firstName = parts[0]
  const lastInitial = parts[parts.length - 1][0]
  return `${firstName} ${lastInitial}.`
}
