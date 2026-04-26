/**
 * NotificationService — envio de push notifications para receptores próximos.
 * Falhas são best-effort: erros de push NÃO bloqueam publicação de doações.
 * @see module-8-doacao-form/TASK-3/ST002
 */

import { donationRepository } from '@/repositories/donation.repository'
import { expoPushService } from '@/services/expo-push.service'
import { canReceivePush } from '@/lib/push-rate-limit'
import type { GeoPoint } from '@/types/common'

export interface NotifyNearbyResult {
  sent: number
  skipped: number
}

export interface SendPushPayload {
  userId: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export class NotificationService {
  /**
   * Busca o push token ativo mais recente de um usuário.
   * Retorna null se não encontrado.
   * @see intake-review/TASK-10/ST003
   */
  async getUserPushToken(userId: string): Promise<string | null> {
    const { prisma } = await import('@/lib/prisma')
    const pt = await prisma.pushToken.findFirst({
      where: { userId, isActive: true },
      orderBy: { updatedAt: 'desc' },
    })
    return pt?.token ?? null
  }

  /**
   * Envia push notification para um usuário específico por userId.
   * Best-effort: falha não lança exceção.
   * @see intake-review/TASK-10/ST002 e ST003
   */
  async sendPushToUser(payload: SendPushPayload): Promise<void> {
    const { prisma } = await import('@/lib/prisma')
    try {
      const { pushTokenRepository } = await import('@/repositories/push-token.repository')
      const tokens = await pushTokenRepository.findByUserId(payload.userId)

      if (!tokens.length) {
        console.info(`[NotificationService] sendPushToUser: no token for userId=${payload.userId}`)
        return
      }

      await expoPushService.sendBatch(
        tokens.map((t) => ({
          to: t.token,
          title: payload.title,
          body: payload.body,
          data: payload.data ?? {},
          sound: 'default' as const,
        }))
      )
    } catch (err) {
      console.warn(`[NotificationService] sendPushToUser failed userId=${payload.userId}:`, err)
      try {
        await prisma.auditLog.create({
          data: {
            action: 'PUSH_FAILED',
            entityType: 'User',
            entityId: payload.userId,
            metadata: {
              reason: err instanceof Error ? err.message : String(err),
              title: payload.title,
              extraData: payload.data ?? {},
            },
          },
        })
      } catch {
        // AuditLog failure is non-fatal
      }
    }
  }


  /**
   * Notifica receptores próximos quando uma doação "Sobrou!" é publicada.
   *
   * Fluxo:
   * 1. Busca receptores com push token no raio de radiusKm
   * 2. Filtra receptores que receberam push nos últimos 15min (anti-spam)
   * 3. Envia push para receptores elegíveis
   * 4. Retorna { sent, skipped }
   *
   * Erros de push são logados e NÃO lançados (best-effort).
   *
   * @param donationId - ID da doação publicada
   * @param location   - Coordenadas da doação
   * @param portions   - Número de porções (para personalizar a mensagem)
   * @param radiusKm   - Raio de notificação (padrão: 3km)
   */
  async notifyNearbyRecipients(
    donationId: string,
    location: GeoPoint,
    portions: number,
    radiusKm = 3
  ): Promise<NotifyNearbyResult> {
    let sent = 0
    let skipped = 0

    try {
      const receptors = await donationRepository.findNearbyReceptorsWithPushToken(location, radiusKm)

      if (!receptors.length) {
        console.info(`[NotificationService] Sobrou! publicado — 0 receptores no raio de ${radiusKm}km. donationId=${donationId}`)
        return { sent: 0, skipped: 0 }
      }

      // Filtrar receptores pelo rate limit de 15min (anti-spam)
      const eligibleTokens: string[] = []
      await Promise.all(
        receptors.map(async (r) => {
          const canSend = await canReceivePush(r.userId)
          if (canSend) {
            eligibleTokens.push(r.token)
          } else {
            skipped++
          }
        })
      )

      if (!eligibleTokens.length) {
        console.info(`[NotificationService] Todos ${receptors.length} receptores filtrados por rate limit.`)
        return { sent: 0, skipped }
      }

      const result = await expoPushService.sendBatch(
        eligibleTokens.map((token) => ({
          to: token,
          title: '🍽️ Alimentos disponíveis perto de você!',
          body: `Corra, são ${portions} refeições!`,
          data: { donationId, type: 'SOBROU' },
          sound: 'default' as const,
        }))
      )

      sent = result.sent
      // Tokens que falharam no envio Expo são contados como skipped
      skipped += result.failed

      console.info(
        `[NotificationService] Sobrou! donationId=${donationId} sent=${sent} skipped=${skipped}`
      )
    } catch (err) {
      // Erros no processo de notificação NÃO bloqueam a publicação
      console.warn('[NotificationService] Erro ao notificar receptores:', err)
    }

    return { sent, skipped }
  }

  /**
   * Notifica receptores com reserva ATIVA quando doação é cancelada.
   * Usa códigos de retirada para encontrar os receptores afetados.
   *
   * @param donationId - ID da doação cancelada
   */
  async notifyReservationCancelled(donationId: string): Promise<void> {
    try {
      const { prisma } = await import('@/lib/prisma')

      // Buscar receptores com código ACTIVE para esta doação
      const activeCodes = await prisma.retrievalCode.findMany({
        where: { donationId, status: 'ACTIVE' },
        select: { receptorId: true },
      })

      const receptorIds = activeCodes
        .map((c) => c.receptorId)
        .filter((id): id is string => id !== null)

      if (!receptorIds.length) return

      const { pushTokenRepository } = await import('@/repositories/push-token.repository')

      const tokenPromises = receptorIds.map((id) => pushTokenRepository.findByUserId(id))
      const tokenArrays = await Promise.all(tokenPromises)
      const tokens = tokenArrays.flat()

      if (!tokens.length) return

      await expoPushService.sendBatch(
        tokens.map((t) => ({
          to: t.token,
          title: 'Doação cancelada',
          body: 'A doação que você reservou foi cancelada pelo doador.',
          data: { donationId, type: 'DONATION_CANCELLED' },
        }))
      )
    } catch (err) {
      console.warn('[NotificationService] Erro ao notificar cancelamento a receptores:', err)
    }
  }

  /**
   * Envia push ao DOADOR 30min antes da janela de doação expirar com opção de extensão.
   * Só envia se extensionCount < 2 (doador ainda pode estender).
   * Best-effort: erros não bloqueiam o cron.
   * @see intake-review/TASK-2/ST002 — gap CL-086
   */
  async sendDonationWindowWarningToDonor(donationId: string): Promise<void> {
    try {
      const { prisma } = await import('@/lib/prisma')

      const donation = await prisma.donation.findUnique({
        where: { id: donationId },
        select: {
          id: true,
          donorId: true,
          status: true,
          windowEnd: true,
          extensionCount: true,
        },
      })

      if (!donation) {
        console.info(`[NotificationService] sendDonationWindowWarningToDonor: doação ${donationId} não encontrada.`)
        return
      }

      // Só enviar para doações ativas
      if (!['AVAILABLE', 'RESERVED'].includes(donation.status)) {
        console.info(`[NotificationService] sendDonationWindowWarningToDonor: doação ${donationId} não está ativa (${donation.status}).`)
        return
      }

      // Não enviar se já atingiu o limite de extensões
      if (donation.extensionCount >= 2) {
        console.info(`[NotificationService] sendDonationWindowWarningToDonor: doação ${donationId} já atingiu máximo de extensões.`)
        return
      }

      const { pushTokenRepository } = await import('@/repositories/push-token.repository')
      const tokens = await pushTokenRepository.findByUserId(donation.donorId)

      if (!tokens.length) {
        console.info(`[NotificationService] No push token for donor ${donation.donorId}`)
        return
      }

      const extensoesRestantes = 2 - donation.extensionCount
      const body = extensoesRestantes === 1
        ? 'Última chance de estender por mais 30 minutos!'
        : 'Deseja estender por mais 30 minutos?'

      await expoPushService.sendBatch(
        tokens.map((t) => ({
          to: t.token,
          title: '⏰ Sua doação expira em 30 minutos!',
          body,
          data: {
            donationId,
            action: 'EXTEND_DONATION',
            screen: 'DashboardScreen',
          },
          sound: 'default' as const,
        }))
      )

      console.info(`[NotificationService] Extension warning sent to donor ${donation.donorId} for donationId=${donationId}`)
    } catch (err) {
      console.warn(`[NotificationService] sendDonationWindowWarningToDonor donationId=${donationId}:`, err)
    }
  }

  /**
   * Envia push de aviso 1h antes da expiração do código.
   * Best-effort: erros de push não lançam exceção.
   * @see module-10-codigos-historico/TASK-4/ST001
   */
  async sendExpirationWarning(codeId: string): Promise<void> {
    try {
      const { prisma } = await import('@/lib/prisma')

      const code = await prisma.retrievalCode.findUnique({
        where: { id: codeId },
        include: {
          receptor: { select: { id: true } },
        },
      })

      if (!code) {
        console.info(`[NotificationService] sendExpirationWarning: código ${codeId} não encontrado.`)
        return
      }

      // Só enviar para códigos ACTIVE
      if (code.status !== 'ACTIVE') {
        console.info(`[NotificationService] sendExpirationWarning: código ${codeId} não está ACTIVE (${code.status}).`)
        return
      }

      if (!code.receptorId) {
        console.info(`[NotificationService] sendExpirationWarning: código ${codeId} sem receptorId.`)
        return
      }

      // Buscar push token do receptor
      const { pushTokenRepository } = await import('@/repositories/push-token.repository')
      const tokens = await pushTokenRepository.findByUserId(code.receptorId)

      if (!tokens.length) {
        console.info(`[NotificationService] No push token for receptor ${code.receptorId}`)
        return
      }

      await expoPushService.sendBatch(
        tokens.map((t) => ({
          to: t.token,
          title: '⏰ Código expirando em breve!',
          body: `Seu código ${code.code} expira em 1 hora! Corra buscar seu alimento.`,
          data: { codeId, screen: 'RetiradaScreen' },
          sound: 'default' as const,
        }))
      )

      // AuditLog
      await prisma.auditLog.create({
        data: {
          action: 'EXPIRATION_WARNING_SENT',
          entityType: 'RetrievalCode',
          entityId: codeId,
          metadata: { receptorId: code.receptorId, expiresAt: code.expiresAt.toISOString() },
        },
      })
    } catch (err) {
      // Erros de push não bloqueiam o fluxo — apenas logar
      console.warn(`[NotificationService] sendExpirationWarning codeId=${codeId}:`, err)
    }
  }
}

export const notificationService = new NotificationService()
