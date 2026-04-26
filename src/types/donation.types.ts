/**
 * Tipos específicos do módulo de doações.
 * Baseado no modelo Prisma `Donation` e nos requisitos do module-8.
 * @see module-8-doacao-form/TASK-0/ST002
 */

import type { DonationStatus, DonationType } from './enums'
import type { GeoPoint, AddressBR, PaginatedResponse } from './common'

// ---------------------------------------------------------------------------
// Re-exports para conveniência dos módulos consumidores
// ---------------------------------------------------------------------------
export type { PaginatedResponse }

// ---------------------------------------------------------------------------
// Payload de criação de doação
// Nota: "portions" = campo no schema Prisma (equivale a "quantity" no INTAKE)
//       "description" = campo no schema Prisma (equivale a "notes" no INTAKE)
// ---------------------------------------------------------------------------

export interface CreateDonationPayload {
  /** Número de porções disponíveis (1–200) */
  portions: number
  windowStart: Date
  /** windowEnd - windowStart >= 30min */
  windowEnd: Date
  /** Endereço de retirada (geocodificado server-side para GeoPoint) */
  address: AddressBR
  /** Raio de visibilidade para receptores (km) — padrão 5 */
  radiusKm: 1 | 2 | 5 | 10
  type: DonationType
  /** Tipo estruturado de alimento — padrão OUTROS para retrocompatibilidade */
  foodType?: string
  /** Descrição opcional — max 200 chars */
  description?: string
}

// ---------------------------------------------------------------------------
// Doação com distância (resultado de findAvailableNear)
// ---------------------------------------------------------------------------

export interface DonationWithDistance {
  id: string
  donorId: string
  type: DonationType
  status: DonationStatus
  description: string
  portions: number
  remainingPortions: number
  location: GeoPoint | null
  radiusKm: number
  windowStart: Date
  windowEnd: Date
  photoUrl: string | null
  createdAt: Date
  updatedAt: Date
  /** Distância em km até o receptor que fez a busca */
  distanceKm: number
}

// ---------------------------------------------------------------------------
// Filtros de listagem de doações
// ---------------------------------------------------------------------------

export interface DonationFilters {
  status?: DonationStatus
  dateFrom?: Date
  dateTo?: Date
}

// ---------------------------------------------------------------------------
// Métricas do doador (para ImpactoCard)
// ---------------------------------------------------------------------------

export interface DonorMetrics {
  /** Total de refeições/porções doadas em doações COMPLETED */
  totalMeals: number
  /** Total de doações confirmadas (COMPLETED) */
  totalDonations: number
  /** Dias com banner ativo — apenas DOADOR_RESTAURANTE (module-17) */
  activeBannerDays: number
  /** Data da última doação COMPLETED */
  lastDonationAt?: Date
}

// ---------------------------------------------------------------------------
// Pagination DTO
// ---------------------------------------------------------------------------

export interface PaginationDto {
  page: number
  limit: number
}
