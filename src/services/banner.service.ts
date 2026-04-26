/**
 * BannerService — lógica de negócio para sistema de banners.
 * @see module-17-banners-system/TASK-2/ST002
 * @contract module-17: DonationStatus.COMPLETED → creditBannerDay (DOADOR_RESTAURANTE: +1 dia)
 * @contract module-5 (CR-X-05): BannerStatus usado por module-18 para exibir banners ACTIVE
 */

import { BannerPosition, BannerStatus, BannerType, UserRole } from '@/types/enums'
import { bannerRepository } from '@/repositories/banner.repository'
import { auditLogRepository } from '@/repositories/audit-log.repository'
import { prisma } from '@/lib/prisma'
import type { ActiveBannerResult } from '@/repositories/banner.repository'

// ---------------------------------------------------------------------------
// BannerService
// ---------------------------------------------------------------------------

export class BannerService {
  /**
   * Credita 1 dia de banner gratuito ao doador restaurante quando doação é COMPLETED.
   * Idempotente: a mesma donation_id não credita duas vezes.
   * Falha isolada: não reverte a doação em caso de erro.
   *
   * @contract module-17/TASK-2/ST002
   */
  async creditBannerDay(donorId: string, donationId: string): Promise<void> {
    // Verificar role no servidor — nunca confiar em parâmetro externo
    const user = await prisma.user.findUnique({
      where: { id: donorId },
      select: { role: true },
    })

    if (!user || user.role !== UserRole.DOADOR_RESTAURANTE) {
      // Skip silencioso para não-restaurantes (contrato explícito)
      return
    }

    const { credited } = await bannerRepository.incrementCreditDays(donorId, 1, donationId)

    if (credited) {
      await auditLogRepository.log('BANNER_CREDIT_EARNED', 'banner_credit', {
        userId: donorId,
        metadata: { donationId, days: 1 },
      })
    }
  }

  /**
   * Retorna saldo e histórico de crédito de banner do restaurante.
   */
  async getBalance(restaurantId: string): Promise<{
    daysAvailable: number
    daysUsed: number
    history: Array<{
      type: string
      days: number
      donationId: string | null
      campaignId: string | null
      createdAt: Date
    }>
  }> {
    const credit = await bannerRepository.getCredit(restaurantId)
    if (!credit) {
      return { daysAvailable: 0, daysUsed: 0, history: [] }
    }
    return {
      daysAvailable: credit.daysAvailable,
      daysUsed: credit.daysUsed,
      history: credit.history.map((h) => ({
        type: h.type,
        days: h.days,
        donationId: h.donationId,
        campaignId: h.campaignId,
        createdAt: h.createdAt,
      })),
    }
  }

  /**
   * Retorna banners ativos para exibição pública.
   * Aplica ordenação: PAID > FREE_RESTAURANT > PERMUTA (peso 30%).
   */
  async getActiveBanners(position: BannerPosition): Promise<ActiveBannerResult[]> {
    return bannerRepository.getActiveBanners(position)
  }

  /**
   * Cria campanha consumindo crédito do restaurante.
   * @throws BAN_001 se saldo insuficiente
   */
  async scheduleCampaign(
    restaurantId: string,
    data: {
      title: string
      imageUrl: string
      linkUrl: string
      position: BannerPosition
      startDate: Date
      endDate: Date
    }
  ) {
    const days = Math.ceil(
      (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const campaign = await bannerRepository.debitCreditDaysAndCreateCampaign(restaurantId, days, data)

    await auditLogRepository.log('BANNER_CAMPAIGN_SCHEDULED', 'banner_campaign', {
      userId: restaurantId,
      entityId: campaign.id,
      metadata: { days, position: data.position },
    })

    return campaign
  }

  /**
   * Ativa campanha (transição DRAFT→ACTIVE ou PAUSED→ACTIVE).
   * Valida que start_date <= hoje.
   */
  async activateCampaign(id: string, adminId: string) {
    const campaign = await bannerRepository.findById(id)
    if (!campaign) throw Object.assign(new Error('Campanha não encontrada.'), { code: 'BAN_003' })

    const allowedFromStatuses: BannerStatus[] = [BannerStatus.DRAFT, BannerStatus.PAUSED, BannerStatus.SCHEDULED]
    if (!allowedFromStatuses.includes(campaign.status)) {
      throw Object.assign(new Error('Campanha não pode ser ativada neste estado.'), { code: 'BAN_004' })
    }

    if (campaign.startDate && campaign.startDate > new Date()) {
      throw Object.assign(new Error('Data de início ainda não chegou.'), { code: 'BAN_004' })
    }

    return bannerRepository.updateStatus(id, BannerStatus.ACTIVE)
  }

  /**
   * Pausa campanha (transição ACTIVE→PAUSED).
   * Para FREE_RESTAURANT: dias não consumidos durante pausa são preservados.
   */
  async pauseCampaign(id: string) {
    const campaign = await bannerRepository.findById(id)
    if (!campaign) throw Object.assign(new Error('Campanha não encontrada.'), { code: 'BAN_003' })

    if (campaign.status !== BannerStatus.ACTIVE) {
      throw Object.assign(new Error('Campanha não está ativa.'), { code: 'BAN_004' })
    }

    return bannerRepository.updateStatus(id, BannerStatus.PAUSED)
  }
}

export const bannerService = new BannerService()
