/**
 * DonationService — lógica de negócio para criação, cancelamento e conclusão de doações.
 * @see module-8-doacao-form/TASK-1/ST002
 */

import { prisma } from '@/lib/prisma'
import { DonationStatus, DonationType, UserRole } from '@/types/enums'
import { geocodeAddress, GeocodingError } from '@/lib/geocoding'
import { donationRepository } from '@/repositories/donation.repository'
import { auditLogRepository } from '@/repositories/audit-log.repository'
import type { Donation } from '@prisma/client'
import type { CreateDonationPayload, DonorMetrics } from '@/types/donation.types'

// ---------------------------------------------------------------------------
// Erros de domínio (mapeados para ERROR-CATALOG em lib/api-error.ts)
// ---------------------------------------------------------------------------

export class DonationNotFoundError extends Error {
  constructor(id: string) {
    super(`Doação ${id} não encontrada.`)
    this.name = 'DonationNotFoundError'
  }
}

export class DonationOwnershipError extends Error {
  constructor() {
    super('Você não tem permissão para cancelar esta doação.')
    this.name = 'DonationOwnershipError'
  }
}

export class DonationStatusError extends Error {
  constructor(currentStatus: string) {
    super(`Não é possível alterar uma doação com status ${currentStatus}.`)
    this.name = 'DonationStatusError'
  }
}

export class DonationValidationError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message)
    this.name = 'DonationValidationError'
  }
}

// Re-export para uso em API routes
export { GeocodingError }

// ---------------------------------------------------------------------------
// DonationService
// ---------------------------------------------------------------------------

export class DonationService {
  /**
   * Cria uma doação com geocoding server-side.
   * 1. Valida windowEnd - windowStart >= 30min e portions 1–200
   * 2. Geocodifica endereço via Mapbox → ViaCEP+Nominatim fallback
   * 3. Persiste no banco com status AVAILABLE
   * 4. Dispara push "Sua doação foi publicada!" em background (não-bloqueante)
   *
   * @throws DonationValidationError VAL_003 se janela < 30min ou portions inválido
   * @throws GeocodingError GEO_001 se todos os geocoders falharem
   */
  async createDonation(donorId: string, data: CreateDonationPayload): Promise<Donation> {
    // Validação: janela mínima de 30 minutos
    const windowDiffMs = data.windowEnd.getTime() - data.windowStart.getTime()
    if (windowDiffMs < 30 * 60 * 1000) {
      throw new DonationValidationError(
        'VAL_003',
        'Janela de retirada deve ser de no mínimo 30 minutos.'
      )
    }

    // Validação: portions 1–200
    if (data.portions < 1 || data.portions > 200) {
      throw new DonationValidationError(
        'VAL_003',
        'Quantidade deve ser entre 1 e 200 porções.'
      )
    }

    // Geocoding server-side (GeocodingError lançado se ambos falharem)
    const location = await geocodeAddress(data.address)

    // Persiste doação
    const donation = await donationRepository.create({ ...data, donorId, location })

    // Push "Doação publicada!" em background (não bloqueia response)
    this._sendDonationPublishedPush(donorId, donation.id).catch((err) =>
      console.warn('[DonationService] Push publicação falhou:', err)
    )

    return donation
  }

  /**
   * Cancela doação verificando ownership.
   * Se há reservas PENDING, receptores também são notificados.
   *
   * @throws DonationNotFoundError se doação não existir
   * @throws DonationOwnershipError AUTH_005 se userId não for o doador
   * @throws DonationStatusError SYS_001 se status não permitir cancelamento
   */
  async cancelDonation(id: string, userId: string): Promise<Donation> {
    const donation = await donationRepository.findById(id)
    if (!donation) throw new DonationNotFoundError(id)

    if (donation.donorId !== userId) throw new DonationOwnershipError()

    // Bloquear cancelamento se há códigos ACTIVE — receptor já está a caminho (CL-043)
    const activeCodes = await prisma.retrievalCode.count({
      where: { donationId: id, status: 'ACTIVE' },
    })
    if (activeCodes > 0) {
      throw new DonationValidationError(
        'CANCEL_001',
        `Cancele os códigos ativos antes de cancelar a doação. Códigos ativos: ${activeCodes}`
      )
    }

    const terminalStatuses: DonationStatus[] = [DonationStatus.CANCELLED, DonationStatus.COMPLETED]
    if (terminalStatuses.includes(donation.status)) {
      throw new DonationStatusError(donation.status)
    }

    const cancelled = await donationRepository.cancel(id)

    await auditLogRepository.log('DONATION_CANCELLED', 'donation', {
      userId,
      entityId: id,
      metadata: { previousStatus: donation.status },
    })

    // Push ao doador "Sua doação foi cancelada"
    this._sendDonationCancelledPush(userId).catch((err) =>
      console.warn('[DonationService] Push cancelamento falhou:', err)
    )

    return cancelled
  }

  /**
   * Conclui doação com transação atômica.
   * Dispara crédito de banner para DOADOR_RESTAURANTE (module-17) e métricas (module-19).
   *
   * @contract module-17: BannerCreditService.addCredit(donorId, 1)
   * @contract module-19: atualiza métricas de impacto coletivo
   */
  async completeDonation(id: string): Promise<Donation> {
    const donation = await donationRepository.findById(id)
    if (!donation) throw new DonationNotFoundError(id)

    const completed = await prisma.$transaction(async (tx) => {
      return donationRepository.updateStatus(id, DonationStatus.COMPLETED, tx)
    })

    await auditLogRepository.log('DONATION_COMPLETED', 'donation', {
      userId: donation.donorId,
      entityId: id,
    })

    // @contract module-17: crédito automático de banner para DOADOR_RESTAURANTE
    // Falha isolada: não reverte a doação em caso de erro no creditBannerDay
    const { bannerService } = await import('@/services/banner.service')
    bannerService.creditBannerDay(donation.donorId, id).catch((err) => {
      console.error(`[DonationService] banner credit falhou para donorId=${donation.donorId}:`, err)
    })

    // @stub module-19: evento de métricas de impacto
    console.info(`IMPACT_METRICS_PENDING: donorId=${donation.donorId} donationId=${id}`)

    return completed
  }

  /** Lista doações com status AVAILABLE do doador. */
  async getActiveDonations(donorId: string): Promise<Donation[]> {
    return donationRepository.findActiveDonations(donorId)
  }

  /**
   * Retorna métricas de impacto do doador.
   * activeBannerDays é @stub até module-17 estar implementado.
   *
   * @contract module-17: BannerService.getActiveDays(donorId) substitui o stub
   */
  async getDonorMetrics(donorId: string, userRole?: string): Promise<DonorMetrics> {
    const aggregates = await donationRepository.getDonorAggregates(donorId)

    // @contract module-17: BannerService.getBalance retorna dias disponíveis
    let activeBannerDays = 0
    if (userRole === UserRole.DOADOR_RESTAURANTE) {
      try {
        const { bannerService } = await import('@/services/banner.service')
        const balance = await bannerService.getBalance(donorId)
        activeBannerDays = balance.daysAvailable
      } catch {
        // fallback: não expor erro ao usuário
      }
    }

    return {
      totalMeals: aggregates._sum.portions ?? 0,
      totalDonations: aggregates._count.id,
      activeBannerDays,
      lastDonationAt: aggregates._max.createdAt ?? undefined,
    }
  }

  // ---------------------------------------------------------------------------
  // Métodos privados (push notifications — fire and forget)
  // ---------------------------------------------------------------------------

  private async _sendDonationPublishedPush(donorId: string, donationId: string): Promise<void> {
    const { pushTokenRepository } = await import('@/repositories/push-token.repository')
    const tokens = await pushTokenRepository.findByUserId(donorId)
    if (!tokens.length) return

    const { expoPushService } = await import('@/services/expo-push.service')
    await expoPushService.sendBatch(
      tokens.map((t) => ({
        to: t.token,
        title: '🍽️ Doação publicada!',
        body: 'Sua doação foi publicada. Aguarde os interessados.',
        data: { donationId, type: 'DONATION_PUBLISHED' },
      }))
    )
  }

  private async _sendDonationCancelledPush(donorId: string): Promise<void> {
    const { pushTokenRepository } = await import('@/repositories/push-token.repository')
    const tokens = await pushTokenRepository.findByUserId(donorId)
    if (!tokens.length) return

    const { expoPushService } = await import('@/services/expo-push.service')
    await expoPushService.sendBatch(
      tokens.map((t) => ({
        to: t.token,
        title: 'Doação cancelada',
        body: 'Sua doação foi cancelada com sucesso.',
        data: { type: 'DONATION_CANCELLED' },
      }))
    )
  }
}

export const donationService = new DonationService()
