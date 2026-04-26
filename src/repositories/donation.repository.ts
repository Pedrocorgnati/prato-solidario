/**
 * DonationRepository — acesso ao banco para o modelo Donation.
 * Usa $queryRaw para operações PostGIS (location é Unsupported no Prisma).
 * @see module-8-doacao-form/TASK-1/ST001
 */

import { prisma } from '@/lib/prisma'
import { DonationStatus, DonationType } from '@/types/enums'
import type { Donation } from '@prisma/client'
import type { GeoPoint, PaginatedResponse } from '@/types/common'
import type { DonationWithDistance, DonationFilters, PaginationDto, CreateDonationPayload } from '@/types/donation.types'

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

interface RawDonationRow {
  id: string
  donor_id: string
  type: DonationType
  status: DonationStatus
  description: string
  portions: number
  remaining_portions: number
  radius_km: number
  window_start: Date
  window_end: Date
  photo_url: string | null
  created_at: Date
  updated_at: Date
  lat: number | null
  lng: number | null
  distance_km: number
}

// ---------------------------------------------------------------------------
// DonationRepository
// ---------------------------------------------------------------------------

export class DonationRepository {
  /**
   * Cria doação com localização geográfica (PostGIS).
   * Usa $executeRaw para inserir geography(Point) corretamente.
   */
  async create(
    data: CreateDonationPayload & { donorId: string; location: GeoPoint }
  ): Promise<Donation> {
    const foodType = (data.foodType ?? 'OUTROS') as string
    const id = await prisma.$queryRaw<[{ id: string }]>`
      INSERT INTO donations (
        id, donor_id, type, status, description, food_type, portions,
        remaining_portions, location, radius_km,
        window_start, window_end, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${data.donorId}::uuid,
        ${data.type}::"DonationType",
        'AVAILABLE'::"DonationStatus",
        ${data.description ?? ''},
        ${foodType}::"FoodType",
        ${data.portions},
        ${data.portions},
        ST_SetSRID(ST_MakePoint(${data.location.lng}, ${data.location.lat}), 4326)::geography,
        ${data.radiusKm},
        ${data.windowStart},
        ${data.windowEnd},
        NOW(),
        NOW()
      )
      RETURNING id
    `

    return this.findById(id[0].id) as Promise<Donation>
  }

  /** Busca doação por ID. */
  async findById(id: string): Promise<Donation | null> {
    return prisma.donation.findUnique({ where: { id } })
  }

  /**
   * Lista doações do doador com paginação e filtros.
   * @contract module-10: usa esta query para histórico paginado
   */
  async findByDonorId(
    donorId: string,
    pagination: PaginationDto,
    filters?: DonationFilters
  ): Promise<PaginatedResponse<Donation>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const where = {
      donorId,
      deletedAt: null,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.dateFrom || filters?.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.donation.count({ where }),
    ])

    return {
      items,
      total,
      page,
      perPage: limit,
      hasNext: total > page * limit,
    }
  }

  /**
   * Busca doações AVAILABLE no raio do receptor, ordenadas por distância.
   * Usa índice GiST IDX_donations_location_gist (M008).
   * @contract module-9: usa esta query para exibir doações próximas
   */
  async findAvailableNear(
    location: GeoPoint,
    radiusKm: number
  ): Promise<DonationWithDistance[]> {
    const radiusMeters = radiusKm * 1000
    const now = new Date()

    const rows = await prisma.$queryRaw<RawDonationRow[]>`
      SELECT
        d.id,
        d.donor_id,
        d.type,
        d.status,
        d.description,
        d.portions,
        d.remaining_portions,
        d.radius_km,
        d.window_start,
        d.window_end,
        d.photo_url,
        d.created_at,
        d.updated_at,
        ST_Y(d.location::geometry)  AS lat,
        ST_X(d.location::geometry)  AS lng,
        ROUND(
          (ST_Distance(
            d.location,
            ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326)::geography
          ) / 1000.0)::numeric,
          2
        )::float AS distance_km
      FROM donations d
      WHERE
        d.status = 'AVAILABLE'::"DonationStatus"
        AND d.window_end > ${now}
        AND d.deleted_at IS NULL
        AND d.location IS NOT NULL
        AND ST_DWithin(
          d.location,
          ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance_km ASC
    `

    return rows.map((r) => ({
      id: r.id,
      donorId: r.donor_id,
      type: r.type,
      status: r.status,
      description: r.description,
      portions: r.portions,
      remainingPortions: r.remaining_portions,
      radiusKm: r.radius_km,
      windowStart: r.window_start,
      windowEnd: r.window_end,
      photoUrl: r.photo_url,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      location: r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : null,
      distanceKm: r.distance_km,
    }))
  }

  /**
   * Atualiza status de doação, opcionalmente dentro de uma transação Prisma.
   * @contract module-17: completeDonation usa esta função com transação
   */
  async updateStatus(
    id: string,
    status: DonationStatus,
    tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
  ): Promise<Donation> {
    const db = tx ?? prisma
    return db.donation.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    })
  }

  /** Cancela doação com registro de motivo nos metadados (audit log externo). */
  async cancel(id: string): Promise<Donation> {
    return prisma.donation.update({
      where: { id },
      data: {
        status: DonationStatus.CANCELLED,
        updatedAt: new Date(),
      },
    })
  }

  /** Lista doações expiradas (AVAILABLE ou PENDING com windowEnd passado). */
  async findExpiredPending(): Promise<Donation[]> {
    const now = new Date()
    return prisma.donation.findMany({
      where: {
        status: { in: [DonationStatus.AVAILABLE, DonationStatus.PENDING] },
        windowEnd: { lt: now },
        deletedAt: null,
      },
    })
  }

  /** Retorna doações ativas (AVAILABLE) do doador. */
  async findActiveDonations(donorId: string): Promise<Donation[]> {
    return prisma.donation.findMany({
      where: {
        donorId,
        status: DonationStatus.AVAILABLE,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Agrega métricas do doador (apenas doações COMPLETED).
   * @contract module-19: métricas de impacto leem deste mesmo aggregate
   */
  async getDonorAggregates(donorId: string) {
    return prisma.donation.aggregate({
      where: { donorId, status: DonationStatus.COMPLETED, deletedAt: null },
      _count: { id: true },
      _sum: { portions: true },
      _max: { createdAt: true },
    })
  }

  /**
   * Busca receptores próximos com push token ativo para notificação "Sobrou!".
   * Usada por NotificationService.notifyNearbyRecipients.
   * @contract module-23: cron de expiração usa query similar
   */
  async findNearbyReceptorsWithPushToken(
    location: GeoPoint,
    radiusKm: number
  ): Promise<{ userId: string; token: string }[]> {
    const radiusMeters = radiusKm * 1000

    return prisma.$queryRaw<{ userId: string; token: string }[]>`
      SELECT pt.user_id AS "userId", pt.token
      FROM push_tokens pt
      INNER JOIN users u ON u.id = pt.user_id
      INNER JOIN addresses a ON a.user_id = u.id AND a.is_default = true
      WHERE
        u.role = 'RECEPTOR'::"UserRole"
        AND pt.is_active = true
        AND a.lat IS NOT NULL
        AND a.lng IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(a.lng, a.lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${location.lng}, ${location.lat}), 4326)::geography,
          ${radiusMeters}
        )
    `
  }
}

export const donationRepository = new DonationRepository()
