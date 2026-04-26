/**
 * GamificationRepository — persistência de badges e métricas para Hall da Fama.
 *
 * Contratos (TASK-0/TASK-1):
 *   - awardBadge: idempotente via @@unique([userId, type, month, year])
 *   - getTopDonorsMonth: reutiliza lógica de MetricsRepository
 *   - processMonthlyCycle: itera usuários ativos, aplica badges elegíveis
 *
 * @see module-20-gamificacao/TASK-1/ST002
 */

import { prisma } from '@/lib/prisma'
import { BadgeType } from '@/types/enums'
import type { Badge } from '@prisma/client'

export interface TopDonorMonth {
  userId: string
  displayName: string
  avatarUrl: string | null
  totalMeals: number
  rank: number
}

export class GamificationRepository {
  /**
   * Concede badge ao usuário — idempotente: chamadas duplicadas retornam o badge existente.
   * Usa upsert para garantir que @@unique([userId, type, month, year]) nunca seja violado.
   */
  async awardBadge(
    userId: string,
    type: BadgeType,
    month: number | null,
    year: number,
  ): Promise<Badge> {
    // Upsert idempotente: nunca duplica, retorna existente em conflito
    return prisma.badge.upsert({
      where: {
        // compound unique: userId_type_month_year
        userId_type_month_year: {
          userId,
          type: type as unknown as import('@prisma/client').BadgeType,
          month: month ?? 0, // Prisma nullable workaround: usar 0 para null em unique
          year,
        },
      },
      create: {
        userId,
        type: type as unknown as import('@prisma/client').BadgeType,
        month,
        year,
      },
      update: {}, // sem alteração em conflito
    })
  }

  /**
   * Retorna todos os badges do usuário, ordenados do mais recente para o mais antigo.
   */
  async getBadgesByUser(userId: string): Promise<Badge[]> {
    return prisma.badge.findMany({
      where: { userId },
      orderBy: { awardedAt: 'desc' },
    })
  }

  /**
   * Verifica se o usuário já possui um badge específico — evita reprocessamento.
   */
  async hasUserBadge(
    userId: string,
    type: BadgeType,
    month: number | null,
    year: number,
  ): Promise<boolean> {
    const badge = await prisma.badge.findFirst({
      where: {
        userId,
        type: type as unknown as import('@prisma/client').BadgeType,
        month,
        year,
      },
      select: { id: true },
    })
    return badge !== null
  }

  /**
   * Top N doadores de um mês/ano por porções confirmadas.
   * Reutiliza a tabela retrieval_codes → donations (mesma lógica de MetricsRepository).
   * Filtra apenas usuários com hallOfFame: true.
   */
  async getTopDonorsMonth(
    month: number,
    year: number,
    limit: number,
  ): Promise<TopDonorMonth[]> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1)

    const aggregates = await prisma.$queryRaw<
      { donorId: string; totalMeals: bigint }[]
    >`
      SELECT d.donor_id AS "donorId", COALESCE(SUM(rc.portions), 0)::bigint AS "totalMeals"
      FROM retrieval_codes rc
      JOIN donations d ON rc.donation_id = d.id
      WHERE rc.status = 'CONFIRMED'
        AND rc.updated_at >= ${startDate}
        AND rc.updated_at < ${endDate}
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
        hallOfFame: true,
      },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        hallOfFame: true,
      },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))

    const results: TopDonorMonth[] = []
    let rank = 1
    for (const agg of aggregates) {
      const user = userMap.get(agg.donorId)
      if (!user) continue
      results.push({
        userId: user.id,
        displayName: user.name ?? 'Doador',
        avatarUrl: user.photoUrl ?? null,
        totalMeals: Number(agg.totalMeals),
        rank: rank++,
      })
    }

    return results
  }

  /**
   * Top N doadores all-time — filtra apenas usuários com hallOfFame: true.
   */
  async getTopDonorsAllTime(limit: number): Promise<TopDonorMonth[]> {
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
        hallOfFame: true,
      },
      select: { id: true, name: true, photoUrl: true, hallOfFame: true },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))

    const results: TopDonorMonth[] = []
    let rank = 1
    for (const agg of aggregates) {
      const user = userMap.get(agg.donorId)
      if (!user) continue
      results.push({
        userId: user.id,
        displayName: user.name ?? 'Doador',
        avatarUrl: user.photoUrl ?? null,
        totalMeals: Number(agg.totalMeals),
        rank: rank++,
      })
    }

    return results
  }

  /**
   * Contagem de doações de um usuário em um mês/ano.
   */
  async getDonationCountForUserInMonth(
    userId: string,
    month: number,
    year: number,
  ): Promise<number> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1)

    const result = await prisma.retrievalCode.count({
      where: {
        donation: { donorId: userId },
        status: 'CONFIRMED',
        updatedAt: { gte: startDate, lt: endDate },
      },
    })
    return result
  }

  /**
   * Total acumulado de porções de um usuário (ever).
   */
  async getCumulativeMealsByUser(userId: string): Promise<number> {
    const result = await prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COALESCE(SUM(rc.portions), 0)::bigint AS total
      FROM retrieval_codes rc
      JOIN donations d ON rc.donation_id = d.id
      WHERE rc.status = 'CONFIRMED'
        AND d.donor_id = ${userId}
    `
    return Number(result[0]?.total ?? 0)
  }

  /**
   * Total de doações confirmadas ever de um usuário (para PRIMEIRA_DOACAO).
   */
  async getTotalDonationsEver(userId: string): Promise<number> {
    return prisma.retrievalCode.count({
      where: {
        donation: { donorId: userId },
        status: 'CONFIRMED',
      },
    })
  }

  /**
   * Lista IDs de todos os usuários DOADOR_PF ou DOADOR_RESTAURANTE ativos.
   */
  async getActiveDonorIds(): Promise<string[]> {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['DOADOR_PF', 'DOADOR_RESTAURANTE'] },
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    })
    return users.map((u) => u.id)
  }

  /**
   * Atualiza preferência hallOfFame do usuário.
   */
  async updateHallOfFameOptIn(userId: string, enabled: boolean): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { hallOfFame: enabled },
    })
  }
}

export const gamificationRepository = new GamificationRepository()
