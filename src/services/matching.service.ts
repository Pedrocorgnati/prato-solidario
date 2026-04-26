/**
 * MatchingService — algoritmo de matching geográfico com priorização.
 * Aloca doações disponíveis para receptores por proximidade + FIFO (FEAT-CD-007).
 * @see module-9-retirada-publica/TASK-2
 */

import { UserRole } from '@/types/enums'
import { MATCHING_CONFIG } from '@/lib/constants'
import { donationRepository } from '@/repositories/donation.repository'
import { retrievalRepository } from '@/repositories/retrieval.repository'
import { retrievalService } from '@/services/retrieval.service'
import type { MatchingInput } from '@/services/retrieval.service'
import { abuseService } from '@/services/abuse.service'
import { prisma } from '@/lib/prisma'
import type { GeoPoint } from '@/types/common'
import type { DonationWithDistance } from '@/types/donation.types'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface ReceptorInfo {
  role: UserRole | null  // null = receptor sem cadastro
  groupSize: number
  location: GeoPoint
  ipFingerprint?: string | null  // IP+fingerprint hash para anônimos (INT-062)
  userId?: string | null
  ongVerified?: boolean  // Para ONGs: verificar se está aprovada
}

export interface MatchingResult {
  available: true
  donationId: string
  portions: number
  code: string
  expiresAt: Date
  donorBairro: string
  donorCidade: string
  windowStart: Date
  windowEnd: Date
}

export interface MatchingFailure {
  available: false
  message: string
  reason?: 'NO_DONATIONS' | 'CODE_LIMIT' | 'INSUFFICIENT_QUANTITY' | 'ONG_NOT_VERIFIED' | 'ABUSE_BLOCKED'
  activeCode?: { code: string; expiresAt: Date }
  unblockedAt?: Date
}

// ---------------------------------------------------------------------------
// Funções auxiliares
// ---------------------------------------------------------------------------

/**
 * Calcula score de prioridade do receptor.
 * Família (>2 pessoas) > Individual > ONG/Restaurante.
 * Exportado para uso em batch allocation e admin dashboard.
 * @see module-9-retirada-publica/TASK-2/ST001
 */
export function priorityScore(receptor: ReceptorInfo): number {
  const { role, groupSize } = receptor

  // PF família (sem cadastro ou RECEPTOR com qtd > 2): prioridade máxima
  if (groupSize > MATCHING_CONFIG.FAMILY_MIN_QUANTITY) return MATCHING_CONFIG.PRIORITY_SCORES.FAMILY

  // Individual sem cadastro ou RECEPTOR: alta prioridade
  if (!role || role === UserRole.RECEPTOR) return MATCHING_CONFIG.PRIORITY_SCORES.INDIVIDUAL

  // ONG ou Marmitaria: prioridade reduzida
  if (role === UserRole.ONG || role === UserRole.MARMITARIA) return MATCHING_CONFIG.PRIORITY_SCORES.ONG

  // Restaurante (doador_restaurante): prioridade reduzida
  if (role === UserRole.DOADOR_RESTAURANTE) return MATCHING_CONFIG.PRIORITY_SCORES.RESTAURANT

  return MATCHING_CONFIG.PRIORITY_SCORES.INDIVIDUAL
}

/**
 * Ordena doações por distância, depois FIFO (INT-061).
 */
function sortDonations(
  donations: DonationWithDistance[]
): DonationWithDistance[] {
  return [...donations].sort((a, b) => {
    // 1º critério: distância (mais próximo)
    const distDiff = a.distanceKm - b.distanceKm
    if (Math.abs(distDiff) > 0.01) return distDiff

    // 2º critério: FIFO — mais antiga primeiro (INT-061)
    return a.createdAt.getTime() - b.createdAt.getTime()
  })
}

/**
 * Para famílias (groupSize >= 3), ordena priorizando doações de DOADOR_RESTAURANTE
 * sobre doadores individuais. Proximidade é critério secundário (CL-069).
 * @see intake-review/TASK-11/ST001
 */
function sortDonationsForFamily(
  donations: DonationWithDistance[],
  restaurantDonorIds: Set<string>
): DonationWithDistance[] {
  return [...donations].sort((a, b) => {
    const aIsRestaurant = restaurantDonorIds.has(a.donorId) ? 0 : 1
    const bIsRestaurant = restaurantDonorIds.has(b.donorId) ? 0 : 1

    // 1º critério: restaurante primeiro
    if (aIsRestaurant !== bIsRestaurant) return aIsRestaurant - bIsRestaurant

    // 2º critério: distância
    const distDiff = a.distanceKm - b.distanceKm
    if (Math.abs(distDiff) > 0.01) return distDiff

    // 3º critério: FIFO
    return a.createdAt.getTime() - b.createdAt.getTime()
  })
}

/**
 * Busca IDs de doadores com role DOADOR_RESTAURANTE no conjunto fornecido.
 */
async function fetchRestaurantDonorIds(donorIds: string[]): Promise<Set<string>> {
  if (!donorIds.length) return new Set()
  const rows = await prisma.user.findMany({
    where: { id: { in: donorIds }, role: UserRole.DOADOR_RESTAURANTE },
    select: { id: true },
  })
  return new Set(rows.map((r) => r.id))
}

// ---------------------------------------------------------------------------
// MatchingService
// ---------------------------------------------------------------------------

export class MatchingService {
  /**
   * Aloca doação para receptor individual ou família (sem verificação de ONG).
   * Verifica anti-abuso e limite de código ativo para anônimos.
   * @see module-9-retirada-publica/TASK-2/ST002
   */
  async matchDonationToReceptor(
    location: GeoPoint,
    quantity: number,
    receptor: ReceptorInfo,
    preferredDonationId?: string
  ): Promise<MatchingResult | MatchingFailure> {
    // 1. Verificar anti-abuso
    if (receptor.ipFingerprint || receptor.userId) {
      const ip = receptor.ipFingerprint?.split(':')[0] ?? '0.0.0.0'
      const fp = receptor.ipFingerprint?.split(':').slice(1).join(':') ?? null
      const abuseCheck = await abuseService.checkAbuse(ip, fp, receptor.userId ?? undefined)
      if (abuseCheck.blocked) {
        return {
          available: false,
          message: `Você atingiu o limite de solicitações. Tente novamente em ${abuseCheck.unblockedAt?.toLocaleDateString('pt-BR') ?? 'breve'}.`,
          reason: 'ABUSE_BLOCKED',
          unblockedAt: abuseCheck.unblockedAt,
        }
      }
    }

    // 2. Receptor anônimo: verificar limite de 1 código ativo (INT-062)
    if (!receptor.userId && receptor.ipFingerprint) {
      const activeCodes = await retrievalRepository.findActiveByReceptor(receptor.ipFingerprint)
      if (activeCodes.length >= MATCHING_CONFIG.MAX_ACTIVE_CODES_ANONYMOUS) {
        const active = activeCodes[0]
        return {
          available: false,
          message: 'Você já possui um código ativo. Use-o antes de solicitar outro.',
          reason: 'CODE_LIMIT',
          activeCode: { code: active.code, expiresAt: active.expiresAt },
        }
      }
    }

    // 3. Buscar doações no raio (ajustado por prioridade — INT-060)
    // Score alto (família 1.5) = raio expandido (7.5km) → mais opções
    // Score baixo (ONG 0.8) = raio reduzido (4km) → deixa próximas para individuais
    const score = priorityScore(receptor)
    const effectiveRadius = MATCHING_CONFIG.DEFAULT_RADIUS_KM * score
    const donations = await donationRepository.findAvailableNear(
      location,
      effectiveRadius
    )

    if (!donations.length) {
      return {
        available: false,
        message: 'Não há alimentos disponíveis no raio de 5km agora. Tente novamente mais tarde ou amplie sua localização.',
        reason: 'NO_DONATIONS',
      }
    }

    // 4. Se preferredDonationId fornecido, tentar usar diretamente (bypass matching)
    if (preferredDonationId) {
      const preferred = donations.find((d) => d.id === preferredDonationId && d.remainingPortions >= quantity)
      if (preferred) {
        // Bypass sorting — usar doação preferida diretamente
        return this._generateAndReturn(preferred, quantity, receptor)
      }
      // Doação preferida não disponível — fallback para matching normal
    }

    // 5. Ordenar: família→restaurante (CL-069) ou distância → FIFO
    let sorted: DonationWithDistance[]
    const isFamily = quantity > MATCHING_CONFIG.FAMILY_MIN_QUANTITY
    if (isFamily) {
      const donorIds = [...new Set(donations.map((d) => d.donorId))]
      const restaurantIds = await fetchRestaurantDonorIds(donorIds)
      sorted = sortDonationsForFamily(donations, restaurantIds)
    } else {
      sorted = sortDonations(donations)
    }

    // 6. Selecionar primeira com quantidade suficiente
    const selected = sorted.find((d) => d.remainingPortions >= quantity)
    if (!selected) {
      return {
        available: false,
        message: 'Não há doações com quantidade suficiente disponíveis.',
        reason: 'INSUFFICIENT_QUANTITY',
      }
    }

    // 6. Gerar código via RetrievalService (com transação + SELECT FOR UPDATE)
    const type: 'INDIVIDUAL' | 'FAMILY' =
      quantity > MATCHING_CONFIG.FAMILY_MIN_QUANTITY ? 'FAMILY' : 'INDIVIDUAL'
    const matchingInput: MatchingInput = {
      donationId: selected.id,
      portions: quantity,
    }

    const retrievalCode = await retrievalService.generateRetrievalCode(
      matchingInput,
      receptor.userId ?? receptor.ipFingerprint ?? null,
      type
    )

    // 7. Buscar bairro/cidade do doador (via address — apenas bairro, nunca endereço completo)
    const donorAddress = await this._getDonorAddress(selected.donorId)

    return {
      available: true,
      donationId: selected.id,
      portions: quantity,
      code: retrievalCode.code,
      expiresAt: retrievalCode.expiresAt,
      donorBairro: donorAddress.bairro,
      donorCidade: donorAddress.cidade,
      windowStart: selected.windowStart,
      windowEnd: selected.windowEnd,
    }
  }

  /**
   * Alocação para grupo (ONG verificada).
   * Gera único código com quantidade total.
   * @see module-9-retirada-publica/TASK-2/ST003
   */
  async matchForGroup(
    location: GeoPoint,
    quantity: number,
    ongInfo: ReceptorInfo
  ): Promise<MatchingResult | MatchingFailure> {
    // Validar ONG verificada
    if (!ongInfo.ongVerified) {
      return {
        available: false,
        message: 'ONG não verificada. Aguarde aprovação do administrador.',
        reason: 'ONG_NOT_VERIFIED',
      }
    }

    // ONG usa score 0.8 → raio reduzido, deixando doações próximas para individuais (INT-060)
    const score = priorityScore(ongInfo)
    const effectiveRadius = MATCHING_CONFIG.DEFAULT_RADIUS_KM * score
    const donations = await donationRepository.findAvailableNear(
      location,
      effectiveRadius
    )

    if (!donations.length) {
      return {
        available: false,
        message: 'Não há alimentos disponíveis no raio de 5km agora.',
        reason: 'NO_DONATIONS',
      }
    }

    const sorted = sortDonations(donations)
    const selected = sorted.find((d) => d.remainingPortions >= quantity)

    if (!selected) {
      const maxAvailable = Math.max(...donations.map((d) => d.remainingPortions))
      return {
        available: false,
        message: `Não há doações com ${quantity} refeições disponíveis. Máximo disponível: ${maxAvailable}.`,
        reason: 'INSUFFICIENT_QUANTITY',
      }
    }

    const matchingInput: MatchingInput = {
      donationId: selected.id,
      portions: quantity,
    }

    const retrievalCode = await retrievalService.generateRetrievalCode(
      matchingInput,
      ongInfo.userId ?? null,
      'FAMILY' // ONGs usam tipo FAMILY para quantidade > 2
    )

    const donorAddress = await this._getDonorAddress(selected.donorId)

    return {
      available: true,
      donationId: selected.id,
      portions: quantity,
      code: retrievalCode.code,
      expiresAt: retrievalCode.expiresAt,
      donorBairro: donorAddress.bairro,
      donorCidade: donorAddress.cidade,
      windowStart: selected.windowStart,
      windowEnd: selected.windowEnd,
    }
  }

  /**
   * Encontra a próxima doação disponível próxima a uma doação de referência.
   * Usado após report de ausência do doador (CL-084).
   *
   * @param params.donationId - ID da doação de referência (para obter localização)
   * @param params.quantity   - Quantidade de porções necessária
   * @returns dados básicos da próxima doação ou null se não houver disponível
   */
  async findNextAvailable(params: {
    donationId: string
    quantity: number
  }): Promise<{ id: string; donorBairro: string; donorCidade: string; windowEnd: string } | null> {
    try {
      const { prisma } = await import('@/lib/prisma')

      // Buscar localização da doação de referência
      const refDonation = await prisma.donation.findUnique({
        where: { id: params.donationId },
        select: { donorId: true },
      })
      if (!refDonation) return null

      // Obter endereço do doador original para usar como ponto de referência
      const address = await prisma.address.findFirst({
        where: { userId: refDonation.donorId, isPrimary: true },
        select: { lat: true, lng: true },
      })
      if (!address?.lat || !address?.lng) return null

      const location = { lat: address.lat, lng: address.lng }
      const donations = await donationRepository.findAvailableNear(location, MATCHING_CONFIG.DEFAULT_RADIUS_KM)

      // Excluir a doação original e filtrar por quantidade disponível
      const candidates = donations.filter(
        (d) => d.id !== params.donationId && d.remainingPortions >= params.quantity
      )
      if (!candidates.length) return null

      const sorted = sortDonations(candidates)
      const next = sorted[0]
      const donorAddress = await this._getDonorAddress(next.donorId)

      return {
        id: next.id,
        donorBairro: donorAddress.bairro,
        donorCidade: donorAddress.cidade,
        windowEnd: next.windowEnd.toISOString(),
      }
    } catch (err) {
      console.warn('[MatchingService.findNextAvailable]', err)
      return null
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------------

  /** Gera código e retorna resultado de matching para uma doação selecionada. */
  private async _generateAndReturn(
    donation: DonationWithDistance,
    quantity: number,
    receptor: ReceptorInfo
  ): Promise<MatchingResult> {
    const type: 'INDIVIDUAL' | 'FAMILY' =
      quantity > MATCHING_CONFIG.FAMILY_MIN_QUANTITY ? 'FAMILY' : 'INDIVIDUAL'
    const matchingInput: MatchingInput = {
      donationId: donation.id,
      portions: quantity,
    }
    const retrievalCode = await retrievalService.generateRetrievalCode(
      matchingInput,
      receptor.userId ?? receptor.ipFingerprint ?? null,
      type
    )
    const donorAddress = await this._getDonorAddress(donation.donorId)
    return {
      available: true,
      donationId: donation.id,
      portions: quantity,
      code: retrievalCode.code,
      expiresAt: retrievalCode.expiresAt,
      donorBairro: donorAddress.bairro,
      donorCidade: donorAddress.cidade,
      windowStart: donation.windowStart,
      windowEnd: donation.windowEnd,
    }
  }

  /** Busca bairro/cidade do endereço primário do doador. Nunca expõe logradouro. */
  private async _getDonorAddress(donorId: string): Promise<{ bairro: string; cidade: string }> {
    const { prisma } = await import('@/lib/prisma')
    const address = await prisma.address.findFirst({
      where: { userId: donorId, isPrimary: true },
      select: { bairro: true, cidade: true },
    })
    return { bairro: address?.bairro ?? '', cidade: address?.cidade ?? '' }
  }
}

export const matchingService = new MatchingService()

