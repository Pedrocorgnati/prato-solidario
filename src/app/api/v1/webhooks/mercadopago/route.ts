/**
 * POST /api/v1/webhooks/mercadopago
 * Recebe notificações de pagamento do MercadoPago e confirma créditos de marmitas.
 *
 * INT-098: Webhook de créditos | INT-099: Não retém valor | FEAT-MM-002
 *
 * Padrão: responde 200 imediatamente, processa de forma assíncrona (fire-and-forget).
 * Idempotência via ProcessedWebhook.paymentId.
 *
 * Fluxo MP Connect:
 * 1. Sponsor seleciona marmitaria + quantidade → SponsorPurchase criado + SponsoredMeals
 *    com marmitariaId definido (pré-alocados antes do pagamento)
 * 2. Pagamento é processado pelo MP diretamente na conta da marmitaria (INT-099)
 * 3. Webhook confirma → atualiza SponsorPurchase.status + MarmitariaBalance
 */
import { type NextRequest } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { validateWebhookSignature } from '@/services/mercadopago.service'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/env'
import { PurchaseStatus } from '@/types/enums'
import { createRequestLogger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

interface MPWebhookPayload {
  type: string
  action: string
  data: { id: string }
}

export async function POST(request: NextRequest) {
  // 1. Lê body bruto — necessário para validação HMAC
  const rawBody = await request.text()
  const xSignature = request.headers.get('x-signature') ?? ''
  const xRequestId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  const log = createRequestLogger({
    correlationId: xRequestId,
    route: '/api/v1/webhooks/mercadopago',
  })

  // 2. Valida assinatura HMAC-SHA256 antes de qualquer processamento
  if (!validateWebhookSignature(rawBody, xSignature, xRequestId)) {
    log.warn(
      { ip: request.headers.get('x-forwarded-for') },
      'mp.webhook.signature_invalid',
    )
    Sentry.captureMessage('MP webhook signature mismatch', {
      level: 'error',
      tags: { webhook: 'mercadopago', stage: 'verify' },
      extra: { xRequestId, hasSignature: !!xSignature },
    })
    return new Response(JSON.stringify({ error: 'Assinatura inválida' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let payload: MPWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('OK', { status: 200 })
  }

  // 3. Ignora tipos não relevantes (subscriptions, chargebacks, etc.)
  if (payload.type !== 'payment') {
    log.info({ type: payload.type }, 'mp.webhook.type_ignored')
    return new Response('OK', { status: 200 })
  }

  const paymentId = String(payload.data?.id ?? '')
  if (!paymentId) {
    return new Response('OK', { status: 200 })
  }

  // 4. Idempotência — guarda antes de processar para evitar race condition
  const alreadyProcessed = await prisma.processedWebhook.findUnique({
    where: { paymentId },
    select: { id: true },
  })

  if (alreadyProcessed) {
    log.info({ paymentId }, 'mp.webhook.already_processed')
    return new Response('OK', { status: 200 })
  }

  // 5. Retorna 200 imediatamente — MP faz retry em 5xx
  // Processamento ocorre de forma assíncrona após o retorno
  Promise.resolve()
    .then(() => processPaymentWebhook(payload, paymentId, xRequestId))
    .catch((err) => {
      log.error({ err: String(err), paymentId }, 'mp.webhook.async_processing_error')
      Sentry.captureException(err, {
        tags: { webhook: 'mercadopago', stage: 'process', severity: 'critical' },
        extra: { paymentId, xRequestId },
      })
    })

  return new Response('OK', { status: 200 })
}

/**
 * Processa o pagamento aprovado e confirma créditos de marmitas.
 * Executado de forma assíncrona após o retorno do 200.
 */
async function processPaymentWebhook(
  payload: MPWebhookPayload,
  paymentId: string,
  correlationId: string,
): Promise<void> {
  const { action } = payload
  const log = createRequestLogger({
    correlationId,
    route: '/api/v1/webhooks/mercadopago',
  })

  if (!['payment.created', 'payment.updated'].includes(action)) {
    log.info({ action }, 'mp.webhook.action_ignored')
    return
  }

  // Busca detalhes do pagamento na API MP
  const mpAccessToken = env.MERCADOPAGO_ACCESS_TOKEN
  if (!mpAccessToken) {
    log.error({}, 'mp.webhook.access_token_missing')
    return
  }

  let payment: MPPaymentDetail
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    })

    if (!response.ok) {
      log.error({ paymentId, status: response.status }, 'mp.webhook.payment_fetch_failed')
      return
    }

    payment = await response.json()
  } catch (err) {
    log.error({ paymentId, err: String(err) }, 'mp.webhook.payment_fetch_network_error')
    return
  }

  // Só processa pagamentos aprovados
  if (payment.status !== 'approved') {
    log.info({ paymentId, status: payment.status }, 'mp.webhook.payment_not_approved')
    // Para pagamentos pendentes: NÃO registra ProcessedWebhook (aguarda evento approved)
    return
  }

  // external_reference = SponsorPurchase.id (definido no momento da criação do pagamento)
  const externalReference = payment.external_reference
  if (!externalReference) {
    log.error({ paymentId }, 'mp.webhook.external_reference_missing')
    return
  }

  const purchase = await prisma.sponsorPurchase.findUnique({
    where: { id: externalReference },
  })

  if (!purchase) {
    log.error(
      { externalReference, paymentId },
      'mp.webhook.sponsor_purchase_not_found',
    )
    return
  }

  // Busca marmitariaId via SponsoredMeals pré-alocados para esta purchase
  const marmitariaIds = await prisma.sponsoredMeal
    .findMany({
      where: { purchaseId: purchase.id, marmitariaId: { not: null } },
      select: { marmitariaId: true },
      distinct: ['marmitariaId'],
    })
    .then((meals) => meals.map((m) => m.marmitariaId).filter(Boolean) as string[])

  try {
    await prisma.$transaction(async (tx) => {
      // Confirma a purchase
      await tx.sponsorPurchase.update({
        where: { id: purchase.id },
        data: { mpPaymentId: paymentId, paymentStatus: PurchaseStatus.APPROVED },
      })

      // Atualiza MarmitariaBalance para cada marmitaria envolvida
      for (const marmitariaId of marmitariaIds) {
        const mealsForThisMarmitaria = await tx.sponsoredMeal.count({
          where: { purchaseId: purchase.id, marmitariaId },
        })

        await tx.marmitariaBalance.upsert({
          where: { marmitariaId },
          create: {
            marmitariaId,
            availableCredits: mealsForThisMarmitaria,
            totalEarned: purchase.unitPrice.mul(mealsForThisMarmitaria),
          },
          update: {
            availableCredits: { increment: mealsForThisMarmitaria },
            totalEarned: { increment: purchase.unitPrice.mul(mealsForThisMarmitaria) },
          },
        })
      }

      // Registra idempotência
      await tx.processedWebhook.create({
        data: {
          paymentId,
          provider: 'mercadopago',
          action,
        },
      })
    })

    log.info(
      {
        paymentId,
        purchaseId: purchase.id,
        marmitariasCredited: marmitariaIds.length,
        quantity: purchase.quantity,
      },
      'mp.webhook.payment_processed',
    )
  } catch (err) {
    log.error(
      { paymentId, purchaseId: purchase.id, err: String(err) },
      'mp.webhook.credit_transaction_failed',
    )
  }
}

interface MPPaymentDetail {
  id: number
  status: string
  external_reference?: string
  transaction_amount: number
  [key: string]: unknown
}
