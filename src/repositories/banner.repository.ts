/**
 * BannerRepository — CRUD Prisma para sistema de banners.
 * @see module-17-banners-system/TASK-2/ST001
 */

import { prisma } from '@/lib/prisma'
import { BannerStatus, BannerType, BannerCreditType, BannerPosition } from '@/types/enums'
import type { BannerCampaign, BannerCredit, BannerCreditHistory } from '@prisma/client'

// ---------------------------------------------------------------------------
// Tipos de retorno
// ---------------------------------------------------------------------------

export type BannerWithCredit = BannerCredit & {
  history: BannerCreditHistory[]
}

export type ActiveBannerResult = {
  id: string
  title: string
  imageUrl: string
  linkUrl: string | null
  position: BannerPosition
  type: BannerType
  priority: number
}

export type CampaignListItem = BannerCampaign & {
  advertiser: { id: string; name: string; email: string } | null
  position: BannerPosition
  priority: number
}

// ---------------------------------------------------------------------------
// BannerRepository
// ---------------------------------------------------------------------------

class BannerRepository {
  // ── Crédito ─────────────────────────────────────────────────────────────

  /**
   * Upsert de BannerCredit para o restaurante.
   * Garante que todo restaurante tenha exatamente um registro.
   */
  async findOrCreateCredit(restaurantId: string): Promise<BannerCredit> {
    return prisma.bannerCredit.upsert({
      where: { restaurantId },
      create: { restaurantId, daysAvailable: 0, daysUsed: 0 },
      update: {},
    })
  }

  /**
   * Incrementa days_available atomicamente dentro de uma transação Prisma.
   * Cria BannerCreditHistory(type=EARNED).
   * Idempotente: verifica se donation_id já foi creditado antes de incrementar.
   */
  async incrementCreditDays(
    restaurantId: string,
    days: number,
    donationId: string
  ): Promise<{ credited: boolean; credit: BannerCredit }> {
    return prisma.$transaction(async (tx) => {
      // Verificar idempotência
      const existing = await tx.bannerCreditHistory.findFirst({
        where: { donationId, type: BannerCreditType.EARNED },
      })
      if (existing) {
        const credit = await tx.bannerCredit.findUnique({ where: { restaurantId } })
        return { credited: false, credit: credit! }
      }

      // Upsert crédito e incrementar
      const credit = await tx.bannerCredit.upsert({
        where: { restaurantId },
        create: { restaurantId, daysAvailable: days, daysUsed: 0 },
        update: { daysAvailable: { increment: days } },
      })

      // Registrar histórico
      await tx.bannerCreditHistory.create({
        data: {
          creditId: credit.id,
          type: BannerCreditType.EARNED,
          days,
          donationId,
        },
      })

      return { credited: true, credit }
    })
  }

  /**
   * Debita days do saldo disponível atomicamente.
   * Cria BannerCreditHistory(type=USED) e retorna campanha criada.
   * @throws Error se saldo insuficiente
   */
  async debitCreditDaysAndCreateCampaign(
    restaurantId: string,
    days: number,
    campaignData: {
      title: string
      imageUrl: string
      linkUrl: string
      position: BannerPosition
      startDate: Date
      endDate: Date
    }
  ): Promise<BannerCampaign> {
    return prisma.$transaction(async (tx) => {
      const credit = await tx.bannerCredit.findUnique({ where: { restaurantId } })
      if (!credit || credit.daysAvailable < days) {
        throw Object.assign(new Error('Saldo insuficiente de dias de banner.'), { code: 'BAN_001' })
      }

      // Debitar saldo
      const updatedCredit = await tx.bannerCredit.update({
        where: { restaurantId },
        data: {
          daysAvailable: { decrement: days },
          daysUsed: { increment: days },
        },
      })

      // Criar campanha
      const campaign = await tx.bannerCampaign.create({
        data: {
          title: campaignData.title,
          type: BannerType.FREE_RESTAURANT,
          advertiserId: restaurantId,
          imageUrl: campaignData.imageUrl,
          linkUrl: campaignData.linkUrl,
          position: campaignData.position,
          status: BannerStatus.DRAFT,
          priority: 500,
          startDate: campaignData.startDate,
          endDate: campaignData.endDate,
        },
      })

      // Registrar histórico de uso
      await tx.bannerCreditHistory.create({
        data: {
          creditId: updatedCredit.id,
          type: BannerCreditType.USED,
          days,
          campaignId: campaign.id,
        },
      })

      return campaign
    })
  }

  /**
   * Retorna BannerCredit com histórico completo para um restaurante.
   */
  async getCredit(restaurantId: string): Promise<BannerWithCredit | null> {
    return prisma.bannerCredit.findUnique({
      where: { restaurantId },
      include: {
        history: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })
  }

  // ── Banners Ativos (público) ─────────────────────────────────────────────

  /**
   * Retorna campanhas ACTIVE para uma posição, ordenadas por prioridade.
   * Filtra por período (start_date <= now <= end_date).
   * Ordenação: menor priority = maior prioridade (PAID=100, FREE=500, PERMUTA=900).
   */
  async getActiveBanners(position: BannerPosition): Promise<ActiveBannerResult[]> {
    const now = new Date()
    const campaigns = await prisma.bannerCampaign.findMany({
      where: {
        position,
        status: BannerStatus.ACTIVE,
        deletedAt: null,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: [
        { type: 'asc' }, // PAID < PERMUTA < FREE_RESTAURANT alfabeticamente
        { priority: 'asc' },
      ],
      take: 10,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
        position: true,
        type: true,
        priority: true,
      },
    })

    // Reordenar: PAID primeiro, FREE_RESTAURANT segundo, PERMUTA com peso 30%
    return this._applyTypeOrdering(campaigns as ActiveBannerResult[])
  }

  /**
   * Aplica ordenação por tipo: PAID + FREE_RESTAURANT antes de PERMUTA.
   * PERMUTA recebe peso 30% — inseridos a cada 3 banners.
   */
  private _applyTypeOrdering(banners: ActiveBannerResult[]): ActiveBannerResult[] {
    const paid = banners.filter((b) => b.type === BannerType.PAID || b.type === BannerType.FREE_RESTAURANT)
    const permuta = banners.filter((b) => b.type === BannerType.PERMUTA)

    if (permuta.length === 0) return paid

    // Intercalar: 2 paid/free → 1 permuta (proporção ~70/30)
    const result: ActiveBannerResult[] = []
    let pi = 0
    paid.forEach((b, i) => {
      result.push(b)
      if ((i + 1) % 2 === 0 && pi < permuta.length) {
        result.push(permuta[pi++])
      }
    })
    // Adicionar permuta restante se não houver paid suficiente
    if (paid.length === 0) {
      return permuta
    }
    return result.slice(0, 5)
  }

  // ── Campanhas (admin) ───────────────────────────────────────────────────

  async findManyAdmin(params: {
    status?: BannerStatus
    type?: BannerType
    position?: BannerPosition
    page?: number
    limit?: number
  }): Promise<{ data: CampaignListItem[]; total: number }> {
    const { status, type, position, page = 1, limit = 10 } = params
    const where = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(position ? { position } : {}),
    }

    const [data, total] = await Promise.all([
      prisma.bannerCampaign.findMany({
        where,
        include: { advertiser: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bannerCampaign.count({ where }),
    ])

    return { data: data as CampaignListItem[], total }
  }

  async findById(id: string): Promise<CampaignListItem | null> {
    return prisma.bannerCampaign.findFirst({
      where: { id, deletedAt: null },
      include: { advertiser: { select: { id: true, name: true, email: true } } },
    }) as Promise<CampaignListItem | null>
  }

  async createCampaign(data: {
    title: string
    type: BannerType
    advertiserId?: string
    imageUrl: string
    linkUrl?: string
    position: BannerPosition
    priority?: number
    permutaPartnerUrl?: string
    internalNote?: string
    startDate?: Date
    endDate?: Date
  }): Promise<BannerCampaign> {
    return prisma.bannerCampaign.create({ data: { ...data, status: BannerStatus.DRAFT } })
  }

  async updateCampaign(id: string, data: Partial<{
    title: string
    imageUrl: string
    linkUrl: string
    position: BannerPosition
    priority: number
    permutaPartnerUrl: string
    internalNote: string
    startDate: Date
    endDate: Date
  }>): Promise<BannerCampaign> {
    return prisma.bannerCampaign.update({ where: { id }, data })
  }

  async updateStatus(id: string, status: BannerStatus): Promise<BannerCampaign> {
    return prisma.bannerCampaign.update({ where: { id }, data: { status } })
  }

  async softDelete(id: string): Promise<BannerCampaign> {
    return prisma.bannerCampaign.update({
      where: { id },
      data: { status: BannerStatus.REJECTED, deletedAt: new Date() },
    })
  }

  async updatePosition(id: string, position: BannerPosition, priority: number): Promise<BannerCampaign> {
    return prisma.bannerCampaign.update({ where: { id }, data: { position, priority } })
  }

  // ── Campanhas do restaurante ─────────────────────────────────────────────

  async findByAdvertiser(restaurantId: string): Promise<BannerCampaign[]> {
    return prisma.bannerCampaign.findMany({
      where: { advertiserId: restaurantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })
  }

  async pauseOwnCampaign(id: string, restaurantId: string): Promise<BannerCampaign> {
    const campaign = await prisma.bannerCampaign.findFirst({
      where: { id, advertiserId: restaurantId, deletedAt: null },
    })
    if (!campaign) {
      throw Object.assign(new Error('Campanha não encontrada ou sem permissão.'), { code: 'BAN_003' })
    }
    if (campaign.status !== BannerStatus.ACTIVE) {
      throw Object.assign(new Error('Campanha não está ativa.'), { code: 'BAN_004' })
    }
    return prisma.bannerCampaign.update({ where: { id }, data: { status: BannerStatus.PAUSED } })
  }

  // ── Click tracking ──────────────────────────────────────────────────────

  async incrementClicks(id: string): Promise<void> {
    await prisma.bannerCampaign.updateMany({
      where: { id, deletedAt: null },
      data: { clicks: { increment: 1 } },
    })
  }
}

export const bannerRepository = new BannerRepository()
