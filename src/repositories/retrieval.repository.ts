/**
 * RetrievalRepository — acesso ao banco para o modelo RetrievalCode.
 * Geração de código com formato ditável (INT-051) e anti-colisão.
 * @see module-9-retirada-publica/TASK-1/ST001
 */

import { prisma } from '@/lib/prisma'
import { MATCHING_CONFIG } from '@/lib/constants'
import type { RetrievalCode } from '@prisma/client'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface CreateRetrievalCodeData {
  donationId: string
  receptorId?: string | null
  portions: number
  type?: 'INDIVIDUAL' | 'FAMILY'
  expiresAt: Date
}

export interface CodeHistoryParams {
  page?: number
  pageSize?: number
  status?: string[]
  startDate?: Date
  endDate?: Date
}

export interface CodeHistoryResult {
  data: RetrievalCode[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/** RetrievalCode com dados da doação associada (para listagens). */
export type RetrievalCodeWithDonation = RetrievalCode & {
  donation: {
    id: string
    donorId: string
    description: string
    portions: number
    remainingPortions: number
    status: string
  }
}

// ---------------------------------------------------------------------------
// RetrievalRepository
// ---------------------------------------------------------------------------

export class RetrievalRepository {
  /**
   * Gera código ditável único no formato D{dd}{tipo}{XXXX}.
   * dd   = dia do mês zero-padded (01–31)
   * tipo = "in" (individual) | "f{N}" (família, onde N = groupSize)
   * XXXX = 4 chars alfanuméricos maiúsculos aleatórios (A-Z0-9)
   * Ex: D05inA3K7, D12f3B2M9
   * Anti-colisão: até MATCHING_CONFIG.CODE_EXPIRY_RETRY_MAX tentativas.
   */
  async generateCode(type: 'INDIVIDUAL' | 'FAMILY' = 'INDIVIDUAL', groupSize?: number): Promise<string> {
    const dd = String(new Date().getDate()).padStart(2, '0')
    const tipoStr = type === 'FAMILY' ? `f${groupSize ?? 2}` : 'in'
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const maxRetries = MATCHING_CONFIG.CODE_EXPIRY_RETRY_MAX

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let suffix = ''
      for (let i = 0; i < 4; i++) {
        suffix += charset[Math.floor(Math.random() * charset.length)]
      }
      const code = `D${dd}${tipoStr}${suffix}`

      const existing = await prisma.retrievalCode.findUnique({ where: { code } })
      if (!existing) return code
    }

    throw new Error(`SYS_001 — Colisão de código após ${maxRetries} tentativas.`)
  }

  /**
   * Cria RetrievalCode no banco.
   * @see module-9-retirada-publica/TASK-1/ST001
   */
  async create(data: CreateRetrievalCodeData): Promise<RetrievalCode> {
    const code = await this.generateCode(data.type ?? 'INDIVIDUAL', data.portions)
    return prisma.retrievalCode.create({
      data: {
        donationId: data.donationId,
        receptorId: data.receptorId ?? null,
        code,
        type: data.type === 'FAMILY' ? 'FAMILY' : 'INDIVIDUAL',
        status: 'ACTIVE',
        portions: data.portions,
        expiresAt: data.expiresAt,
      },
    })
  }

  /** Busca por código (formato D{N}{L}{NNNN}). */
  async findByCode(code: string): Promise<RetrievalCode | null> {
    return prisma.retrievalCode.findUnique({ where: { code } })
  }

  /** Busca códigos ACTIVE por receptor (autenticado ou IP+fingerprint via receptorId). */
  async findActiveByReceptor(receptorId: string): Promise<RetrievalCode[]> {
    const now = new Date()
    return prisma.retrievalCode.findMany({
      where: {
        receptorId,
        status: 'ACTIVE',
        expiresAt: { gt: now },
      },
    })
  }

  /** Confirma código: status → CONFIRMED. */
  async confirm(id: string): Promise<RetrievalCode> {
    return prisma.retrievalCode.update({
      where: { id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    })
  }

  /** Expira código: status → EXPIRED. */
  async expire(id: string): Promise<RetrievalCode> {
    return prisma.retrievalCode.update({
      where: { id },
      data: { status: 'EXPIRED' },
    })
  }

  /**
   * Lista códigos ACTIVE com expiresAt <= fim do dia atual.
   * Usado pelo cron de expiração (module-23).
   */
  async findExpiringToday(): Promise<RetrievalCode[]> {
    const now = new Date()
    const { endOfDayBRT } = await import('@/utils/date')
    const endOfTodayBRT = endOfDayBRT()

    return prisma.retrievalCode.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { gte: now, lte: endOfTodayBRT },
      },
    })
  }

  /**
   * Lista códigos ACTIVE pertencentes às doações de um doador.
   * Doador vê seus próprios códigos gerados.
   * @see module-10-codigos-historico/TASK-1/ST002
   */
  async getActiveCodesByDonorId(donorId: string): Promise<RetrievalCodeWithDonation[]> {
    return prisma.retrievalCode.findMany({
      where: {
        status: 'ACTIVE',
        donation: { donorId },
      },
      include: {
        donation: {
          select: {
            id: true,
            donorId: true,
            description: true,
            portions: true,
            remainingPortions: true,
            status: true,
          },
        },
      },
      orderBy: { expiresAt: 'asc' },
    }) as Promise<RetrievalCodeWithDonation[]>
  }

  /**
   * Lista códigos ACTIVE de uma ONG (como receptorId).
   * ONG vê os códigos que solicitou para seus beneficiários.
   * @see module-10-codigos-historico/TASK-2/ST002
   */
  async getActiveCodesByOngId(ongUserId: string): Promise<RetrievalCodeWithDonation[]> {
    return prisma.retrievalCode.findMany({
      where: {
        status: 'ACTIVE',
        receptorId: ongUserId,
      },
      include: {
        donation: {
          select: {
            id: true,
            donorId: true,
            description: true,
            portions: true,
            remainingPortions: true,
            status: true,
          },
        },
      },
      orderBy: { expiresAt: 'asc' },
    }) as Promise<RetrievalCodeWithDonation[]>
  }

  /**
   * Busca código por ID com dados da doação.
   * @see module-10-codigos-historico/TASK-1/ST003
   */
  async findByIdWithDonation(id: string): Promise<RetrievalCodeWithDonation | null> {
    return prisma.retrievalCode.findUnique({
      where: { id },
      include: {
        donation: {
          select: {
            id: true,
            donorId: true,
            description: true,
            portions: true,
            remainingPortions: true,
            status: true,
          },
        },
      },
    }) as Promise<RetrievalCodeWithDonation | null>
  }

  /**
   * Histórico paginado de códigos de uma ONG (CONFIRMED, EXPIRED, CANCELLED).
   * @see module-10-codigos-historico/TASK-3/ST002
   */
  async getCodeHistoryByOngId(ongUserId: string, params: CodeHistoryParams): Promise<CodeHistoryResult> {
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20
    const skip = (page - 1) * pageSize

    type WhereInput = import('@prisma/client').Prisma.RetrievalCodeWhereInput
    const statusFilter: WhereInput['status'] = params.status?.length
      ? { in: params.status as ('ACTIVE' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED')[] }
      : { notIn: ['ACTIVE'] }

    const dateFilter: WhereInput['createdAt'] =
      params.startDate || params.endDate
        ? { gte: params.startDate, lte: params.endDate }
        : undefined

    const where: WhereInput = {
      receptorId: ongUserId,
      status: statusFilter,
      ...(dateFilter ? { createdAt: dateFilter } : {}),
    }

    const [data, total] = await prisma.$transaction([
      prisma.retrievalCode.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      prisma.retrievalCode.count({ where }),
    ])

    return {
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }
  }

  /**
   * Retorna todos os códigos de uma ONG para exportação CSV (sem paginação).
   * Limite: 10.000 registros.
   * @see module-10-codigos-historico/TASK-3/ST003
   */
  async getCodeHistoryForExport(ongUserId: string, params: Omit<CodeHistoryParams, 'page' | 'pageSize'>): Promise<{ data: RetrievalCode[]; total: number }> {
    type WhereInput = import('@prisma/client').Prisma.RetrievalCodeWhereInput
    const statusFilter: WhereInput['status'] = params.status?.length
      ? { in: params.status as ('ACTIVE' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED')[] }
      : { notIn: ['ACTIVE'] }

    const dateFilter: WhereInput['createdAt'] =
      params.startDate || params.endDate
        ? { gte: params.startDate, lte: params.endDate }
        : undefined

    const where: WhereInput = {
      receptorId: ongUserId,
      status: statusFilter,
      ...(dateFilter ? { createdAt: dateFilter } : {}),
    }

    const total = await prisma.retrievalCode.count({ where })

    if (total > 10000) {
      return { data: [], total }
    }

    const data = await prisma.retrievalCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000,
    })

    return { data, total }
  }

  /**
   * Lista códigos ACTIVE de uma ONG (todos, sem paginação).
   * Usado pelo endpoint confirm-all.
   * @see module-10-codigos-historico/TASK-2/ST004
   */
  async getAllActiveCodesByOngId(ongUserId: string): Promise<(RetrievalCode & { donation: { id: string; donorId: string; remainingPortions: number; status: string; type: string } })[]> {
    return prisma.retrievalCode.findMany({
      where: { status: 'ACTIVE', receptorId: ongUserId },
      include: {
        donation: {
          select: { id: true, donorId: true, remainingPortions: true, status: true, type: true },
        },
      },
    }) as Promise<(RetrievalCode & { donation: { id: string; donorId: string; remainingPortions: number; status: string; type: string } })[]>
  }
}

export const retrievalRepository = new RetrievalRepository()
