/**
 * Tipos e DTOs para o módulo de Checkout de Patrocínio.
 * @see module-13-sponsor-checkout/TASK-0/ST-F02
 */

import { PaymentMethod, PurchaseStatus } from './enums'

/**
 * Dados necessários para iniciar uma compra de patrocínio.
 * Validado via Zod em `schemas/sponsor.schema.ts`.
 */
export interface SponsorPurchaseDTO {
  marmitariaId: string
  quantity: number       // mín. 5, máx. 100 (INT-036)
  guestEmail?: string    // obrigatório quando não autenticado (INT-034)
  paymentMethod: PaymentMethod
}

/**
 * Resultado da criação de uma compra — retornado ao frontend.
 */
export interface CreatePurchaseResult {
  purchaseId: string
  initPoint: string    // URL de checkout MercadoPago (redirect para o usuário)
}

/**
 * Dados de uma compra para listagem no histórico.
 */
export interface SponsorPurchaseSummary {
  id: string
  marmitariaName: string
  quantity: number
  totalAmount: number
  paymentMethod: PaymentMethod
  paymentStatus: PurchaseStatus
  createdAt: Date
}

/**
 * Resposta paginada do histórico de patrocínios.
 */
export interface SponsorHistoryResult {
  items: SponsorPurchaseSummary[]
  total: number
  totalInvested: number  // soma de totalAmount das compras APPROVED
}

/**
 * Card público de marmitaria para listagem de patrocínio.
 */
export interface MarmitariaPublicCard {
  id: string
  name: string
  photo: string | null
  neighborhood: string | null
  city: string | null
  pricePerMeal: number | null
  availableCredits: number
  schedule: unknown
}
