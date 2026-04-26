/**
 * SponsorService — orquestração do fluxo de checkout de patrocínio.
 * @see module-13-sponsor-checkout/TASK-1/ST003
 *
 * Responsabilidades:
 * - initiatePurchase: cria SponsorPurchase PENDING + gera Preferência MP
 * - completePurchase: atualiza status + credita SponsoredMeals (chamado pelo webhook)
 * - failPurchase: atualiza status para REJECTED/REFUNDED
 * - sendPurchaseConfirmationEmail: e-mail de confirmação (Should — INT-040)
 * - sendSponsorConfirmationPush: push notification (Should — NOTIFICATION-SPEC)
 */

import { sponsorRepository } from '@/repositories/sponsor.repository'
import { mpConnectionRepository } from '@/repositories/mp-connection.repository'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/env'
import { PurchaseStatus, MarmitariaStatus } from '@/types/enums'
import { expoPushService } from '@/services/expo-push.service'
import { notificationService } from '@/services/notification.service'
import type { SponsorPurchaseDTO, CreatePurchaseResult } from '@/types/sponsor.types'

// ---------------------------------------------------------------------------
// MP Preferences
// ---------------------------------------------------------------------------

interface MPPreferenceItem {
  title: string
  quantity: number
  unit_price: number
  currency_id?: string
}

interface MPPreferencePayload {
  items: MPPreferenceItem[]
  external_reference: string
  back_urls: { success: string; failure: string; pending: string }
  notification_url: string
  auto_return: string
}

interface MPPreferenceResponse {
  id: string
  init_point: string
  sandbox_init_point: string
}

async function createMPPreference(
  accessToken: string,
  payload: MPPreferencePayload
): Promise<MPPreferenceResponse> {
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`MercadoPago API error (${response.status}): ${errorBody}`)
  }

  return response.json()
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const sponsorService = {
  /**
   * Inicia compra:
   * 1. Valida marmitaria ativa
   * 2. Busca token MP da marmitaria (INT-099)
   * 3. Calcula totalAmount
   * 4. Cria SponsorPurchase PENDING
   * 5. Cria Preferência MP com access_token da marmitaria
   * 6. Retorna { purchaseId, initPoint }
   */
  async initiatePurchase(
    data: SponsorPurchaseDTO,
    sponsorId: string | null
  ): Promise<CreatePurchaseResult> {
    // 1. Busca e valida marmitaria
    const marmitaria = await prisma.marmitariaProfile.findUnique({
      where: { id: data.marmitariaId },
      select: { id: true, tradeName: true, status: true, pricePerMeal: true },
    })

    if (!marmitaria || marmitaria.status !== MarmitariaStatus.ACTIVE) {
      throw Object.assign(new Error('Marmitaria não encontrada ou inativa'), {
        code: 'AUTH_008',
      })
    }

    // 2. Busca access_token da marmitaria (MP Connect — INT-099)
    const mpConnection = await mpConnectionRepository.findByMarmitariaId(data.marmitariaId)
    if (!mpConnection || !mpConnection.accessTokenEncrypted) {
      throw Object.assign(new Error('Marmitaria sem conexão MercadoPago configurada'), {
        code: 'SYS_002',
      })
    }
    const accessToken = mpConnectionRepository.decryptAccessToken(
      mpConnection.accessTokenEncrypted
    )

    // 3. Calcula valores
    const unitPrice = Number(marmitaria.pricePerMeal ?? 0)
    const totalAmount = data.quantity * unitPrice

    // 4. Cria SponsorPurchase PENDING
    const purchase = await sponsorRepository.createPurchase({
      sponsorId,
      guestEmail: data.guestEmail ?? null,
      marmitariaId: data.marmitariaId,
      quantity: data.quantity,
      unitPrice,
      totalAmount,
      paymentMethod: data.paymentMethod,
    })

    // 5. Cria Preferência MP com external_reference = purchase.id (usado pelo webhook)
    const appUrl = env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const webhookUrl = `${appUrl}/api/v1/webhooks/mercadopago`

    let preference: MPPreferenceResponse
    try {
      preference = await createMPPreference(accessToken, {
        items: [
          {
            title: `Patrocínio — ${marmitaria.tradeName}`,
            quantity: data.quantity,
            unit_price: unitPrice,
            currency_id: 'BRL',
          },
        ],
        external_reference: purchase.id,
        back_urls: {
          success: `${appUrl}/patrocinar/sucesso?purchase_id=${purchase.id}`,
          failure: `${appUrl}/patrocinar/falha?purchase_id=${purchase.id}`,
          pending: `${appUrl}/patrocinar/pendente?purchase_id=${purchase.id}`,
        },
        notification_url: webhookUrl,
        auto_return: 'approved',
      })
    } catch (err) {
      // Rollback: remove o SponsorPurchase se a Preferência MP falhou (SYS_002)
      await prisma.sponsorPurchase.delete({ where: { id: purchase.id } }).catch(() => {})
      throw Object.assign(
        new Error('Serviço de pagamento temporariamente indisponível'),
        { code: 'SYS_002', cause: err }
      )
    }

    return {
      purchaseId: purchase.id,
      initPoint: preference.init_point,
    }
  },

  /**
   * Completa compra após pagamento APPROVED (chamado pelo webhook de module-12).
   * Idempotente: se já APPROVED, retorna sem duplicar créditos.
   */
  async completePurchase(purchaseId: string, mpPaymentId: string): Promise<void> {
    const purchase = await sponsorRepository.findPurchaseById(purchaseId)
    if (!purchase) {
      throw new Error(`SponsorPurchase não encontrado: ${purchaseId}`)
    }

    // Idempotência: não duplicar créditos se já processado
    if ((purchase as { paymentStatus?: string }).paymentStatus === PurchaseStatus.APPROVED) {
      console.info('[SponsorService] completePurchase idempotente — já APPROVED:', purchaseId)
      return
    }

    // Atualiza status
    await sponsorRepository.updatePurchaseStatus(purchaseId, PurchaseStatus.APPROVED, mpPaymentId)

    // Credita SponsoredMeals (expiresAt = null — INT-100)
    await sponsorRepository.creditMeals(purchase.marmitaria.id, purchase.quantity, purchaseId)

    // Atualiza MarmitariaBalance
    await prisma.marmitariaBalance.upsert({
      where: { marmitariaId: purchase.marmitaria.id },
      create: {
        marmitariaId: purchase.marmitaria.id,
        availableCredits: purchase.quantity,
        totalEarned: purchase.quantity * Number(purchase.marmitaria.pricePerMeal ?? 0),
      },
      update: {
        availableCredits: { increment: purchase.quantity },
        totalEarned: {
          increment: purchase.quantity * Number(purchase.marmitaria.pricePerMeal ?? 0),
        },
      },
    })

    // Should — e-mail de confirmação com AuditLog em falha (CL-096)
    try {
      await sponsorService.sendPurchaseConfirmationEmail(purchaseId, purchase)
    } catch (emailErr) {
      const reason = emailErr instanceof Error ? emailErr.message : String(emailErr)
      console.warn('[SponsorService] Falha ao enviar e-mail de confirmação:', reason)
      const sponsorUserId = purchase.sponsor?.id ?? null
      if (sponsorUserId) {
        await prisma.auditLog.create({
          data: {
            action: 'EMAIL_FAILED',
            entityType: 'SponsorPurchase',
            entityId: purchaseId,
            userId: sponsorUserId,
            metadata: { reason, purchaseId },
          },
        }).catch(() => {})
      }
    }

    // Should — push notification ao patrocinador (falha silenciosa)
    await sponsorService
      .sendSponsorConfirmationPush(purchaseId, purchase)
      .catch((err) =>
        console.warn('[SponsorService] Falha ao enviar push de confirmação ao patrocinador:', err)
      )

    // Should — push notification à marmitaria (CL-202)
    await sponsorService
      .sendMarmitariaPurchaseNotification(purchaseId, purchase)
      .catch((err) =>
        console.warn('[SponsorService] Falha ao enviar push de compra à marmitaria:', err)
      )
  },

  /**
   * Falha de pagamento (REJECTED ou REFUNDED) — chamado pelo webhook.
   */
  async failPurchase(
    purchaseId: string,
    status: PurchaseStatus.REJECTED | PurchaseStatus.REFUNDED,
    mpPaymentId: string
  ): Promise<void> {
    await sponsorRepository.updatePurchaseStatus(purchaseId, status, mpPaymentId)
  },

  // ---------------------------------------------------------------------------
  // Should: E-mail de confirmação (INT-040)
  // ---------------------------------------------------------------------------

  async sendPurchaseConfirmationEmail(
    purchaseId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    purchase: any
  ): Promise<void> {
    const resendApiKey = env.RESEND_API_KEY
    if (!resendApiKey) {
      console.warn('[SponsorService] RESEND_API_KEY não configurada — e-mail pulado')
      return
    }

    const recipientEmail = purchase.guestEmail ?? purchase.sponsor?.email ?? null
    if (!recipientEmail) {
      console.warn('[SponsorService] Sem e-mail do patrocinador — e-mail pulado:', purchaseId)
      return
    }

    const marmitariaName = purchase.marmitaria?.tradeName ?? 'a marmitaria'
    const appUrl = env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const html = `
      <h2>Seu patrocínio foi confirmado! 🍱</h2>
      <p>Obrigado por patrocinar <strong>${purchase.quantity} refeições</strong> para <strong>${marmitariaName}</strong>!</p>
      <ul>
        <li><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</li>
        <li><strong>Quantidade:</strong> ${purchase.quantity} refeições</li>
        <li><strong>Valor total:</strong> R$ ${Number(purchase.totalAmount).toFixed(2).replace('.', ',')}</li>
        <li><strong>Número da transação:</strong> ${purchaseId}</li>
      </ul>
      <p>${purchase.quantity} famílias poderão retirar refeições gratuitas graças ao seu gesto.</p>
      <p><a href="${appUrl}/patrocinar">Ver mais marmitarias para patrocinar →</a></p>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Prato Solidário <noreply@pratosolidario.com.br>',
        to: [recipientEmail],
        subject: 'Seu patrocínio foi confirmado! 🍱',
        html,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Resend API error (${response.status}): ${errorText}`)
    }
  },

  // ---------------------------------------------------------------------------
  // Should: Push notification SPONSOR_CONFIRMATION (NOTIFICATION-SPEC Rock 2)
  // ---------------------------------------------------------------------------

  async sendSponsorConfirmationPush(
    purchaseId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    purchase: any
  ): Promise<void> {
    if (!purchase.sponsorId) return // Guest checkout — sem push token

    // Busca User via SponsorProfile
    const profile = await prisma.sponsorProfile.findUnique({
      where: { id: purchase.sponsorId },
      include: {
        user: {
          include: { pushTokens: { where: { isActive: true } } },
        },
      },
    })

    const pushTokens = profile?.user?.pushTokens ?? []
    if (!pushTokens.length) return // Sem token registrado

    const marmitariaName = purchase.marmitaria?.tradeName ?? 'a marmitaria'

    await expoPushService.sendBatch(
      pushTokens.map((pt: { token: string }) => ({
        to: pt.token,
        title: 'Patrocínio confirmado! 🍱',
        body: `Você patrocinou ${purchase.quantity} refeições para ${marmitariaName}. Obrigado!`,
        data: { type: 'SPONSOR_CONFIRMATION', purchaseId },
      }))
    )
  },

  // ---------------------------------------------------------------------------
  // Should: Push notification à marmitaria após compra (CL-202)
  // ---------------------------------------------------------------------------

  async sendMarmitariaPurchaseNotification(
    purchaseId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    purchase: any
  ): Promise<void> {
    // Buscar userId do owner da marmitaria
    const marmitariaProfile = await prisma.marmitariaProfile.findUnique({
      where: { id: purchase.marmitaria?.id ?? purchase.marmitariaId },
      select: { userId: true, tradeName: true },
    })

    if (!marmitariaProfile) {
      console.info('[SponsorService] sendMarmitariaPurchaseNotification: marmitaria não encontrada')
      return
    }

    const sponsorName =
      purchase.sponsor?.name ??
      purchase.guestEmail ??
      'Um patrocinador'

    const marmitariaName = marmitariaProfile.tradeName ?? 'a marmitaria'
    // Saldo atualizado (incremental — valor que foi creditado nesta compra)
    const body = `${purchase.quantity} refeições patrocinadas por ${sponsorName}. Saldo atualizado.`

    await notificationService.sendPushToUser({
      userId: marmitariaProfile.userId,
      title: 'Nova compra de refeições patrocinadas 🍱',
      body,
      data: {
        type: 'SPONSOR_PURCHASE',
        marmitariaId: purchase.marmitaria?.id ?? purchase.marmitariaId,
        marmitariaName,
        quantity: purchase.quantity,
        sponsorId: purchase.sponsorId ?? null,
        purchaseId,
      },
    })
  },
}
