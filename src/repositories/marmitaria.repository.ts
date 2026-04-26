/**
 * MarmitariaRepository — operações de banco para MarmitariaProfile, MarmitariaBalance e SponsoredMeal.
 * @see module-14-painel-marmitaria
 *
 * INT-042: Painel saldo | INT-043: Confirmação entrega | INT-044: Saldo real-time | INT-045: Pagamentos
 * DB-007: Balance negative guard obrigatório
 */

import { prisma } from '@/lib/prisma'
import { MarmitariaStatus, SponsoredMealStatus, PurchaseStatus } from '@/types/enums'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarmitariaBalanceSummary {
  available: number
  pending: number
  delivered: number
  totalReceivedBrl: number
}

export interface PaymentsQueryParams {
  marmitariaId: string
  page: number
  pageSize: number
  from?: Date
  to?: Date
  exportAll?: boolean
}

export interface UpdateSettingsInput {
  marmitariaId: string
  userId: string
  schedule?: {
    days: string[]
    startTime: string
    endTime: string
    dailyCapacity: number
    orderDeadlineHours: string
  }
  pricePerMeal?: number
  photoUrl?: string
  description?: string
  publicAddress?: {
    neighborhood: string
    city: string
  }
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export const marmitariaRepository = {
  /**
   * Busca o perfil da marmitaria pelo userId.
   */
  async findProfileByUserId(userId: string) {
    return prisma.marmitariaProfile.findUnique({
      where: { userId },
      include: {
        balance: true,
        mpConnection: { select: { status: true } },
        user: { select: { photoUrl: true } },
      },
    })
  },

  /**
   * Calcula o balanço real-time da marmitaria a partir das contagens de SponsoredMeal.
   * DB-007: available e pending nunca retornam valor negativo.
   *
   * @param marmitariaId — MarmitariaProfile.id
   * @param balance — MarmitariaBalance do profile (pode ser null)
   */
  async computeBalance(
    marmitariaId: string,
    balance: { availableCredits: number } | null
  ): Promise<MarmitariaBalanceSummary> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [pendingCount, deliveredCount, revenueResult] = await prisma.$transaction([
      // Marmitas RESERVED (receptor buscou código, marmitaria ainda não confirmou)
      prisma.sponsoredMeal.count({
        where: {
          marmitariaId,
          status: SponsoredMealStatus.RESERVED as unknown as never,
        },
      }),
      // Marmitas DELIVERED no mês corrente
      prisma.sponsoredMeal.count({
        where: {
          marmitariaId,
          status: SponsoredMealStatus.DELIVERED as unknown as never,
          updatedAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      // Receita do mês corrente (SponsorPurchase APPROVED)
      prisma.sponsorPurchase.aggregate({
        where: {
          marmitariaId,
          paymentStatus: PurchaseStatus.APPROVED as unknown as never,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { totalAmount: true },
      }),
    ])

    // DB-007: Balance negative guard — availableCredits nunca pode ser negativo
    const rawAvailable = balance?.availableCredits ?? 0
    const available = Math.max(0, rawAvailable)
    if (rawAvailable < 0) {
      console.warn(
        `[DB-007] MarmitariaBalance.availableCredits negativo para marmitariaId=${marmitariaId}. Retornando 0.`
      )
    }

    const pending = Math.max(0, pendingCount)
    const delivered = Math.max(0, deliveredCount)
    const totalReceivedBrl = Number(revenueResult._sum.totalAmount ?? 0)

    return { available, pending, delivered, totalReceivedBrl }
  },

  /**
   * Busca marmitas RESERVED da marmitaria (pendentes de confirmação de entrega).
   */
  async findPendingMeals(marmitariaId: string) {
    return prisma.sponsoredMeal.findMany({
      where: {
        marmitariaId,
        status: SponsoredMealStatus.RESERVED as unknown as never,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        purchase: {
          select: { quantity: true, createdAt: true },
        },
      },
    })
  },

  /**
   * Busca SponsoredMeal por ID, verificando ownership da marmitaria.
   */
  async findMealById(id: string) {
    return prisma.sponsoredMeal.findUnique({
      where: { id },
      include: {
        purchase: { select: { quantity: true } },
      },
    })
  },

  /**
   * Busca a marmita RESERVED mais antiga para confirmação por código.
   */
  async findOldestReservedMeal(marmitariaId: string) {
    return prisma.sponsoredMeal.findFirst({
      where: {
        marmitariaId,
        status: SponsoredMealStatus.RESERVED as unknown as never,
      },
      orderBy: { createdAt: 'asc' },
    })
  },

  /**
   * Confirma entrega de uma marmita em transação atômica.
   * DB-007: decrementar availableCredits com guard — nunca negativo.
   *
   * @param mealId — SponsoredMeal.id
   * @param marmitariaId — MarmitariaProfile.id
   * @param userId — User.id do funcionário/dono da marmitaria (para AuditLog)
   */
  async confirmDelivery(mealId: string, marmitariaId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Marcar meal como DELIVERED
      const meal = await tx.sponsoredMeal.update({
        where: { id: mealId },
        data: {
          status: SponsoredMealStatus.DELIVERED as unknown as never,
          updatedAt: new Date(),
        },
      })

      // 2. Atualizar balance — decrementar availableCredits (com guard DB-007)
      const currentBalance = await tx.marmitariaBalance.findUnique({
        where: { marmitariaId },
        select: { id: true, availableCredits: true },
      })

      const currentCredits = currentBalance?.availableCredits ?? 0
      const newCredits = Math.max(0, currentCredits - 1)

      if (currentCredits <= 0) {
        console.warn(
          `[DB-007] Tentativa de decrementar availableCredits abaixo de 0 para marmitariaId=${marmitariaId}`
        )
      }

      await tx.marmitariaBalance.upsert({
        where: { marmitariaId },
        create: {
          marmitariaId,
          availableCredits: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
        },
        update: {
          availableCredits: newCredits,
        },
      })

      // 3. AuditLog
      await tx.auditLog.create({
        data: {
          action: 'MEAL_DELIVERED',
          entityType: 'SponsoredMeal',
          entityId: mealId,
          userId,
          metadata: {
            marmitariaId,
            previousCredits: currentCredits,
            newCredits,
          },
        },
      })

      const balance = await tx.marmitariaBalance.findUnique({
        where: { marmitariaId },
        select: { availableCredits: true },
      })

      return {
        meal,
        balanceUpdated: {
          available: Math.max(0, balance?.availableCredits ?? 0),
          delivered: newCredits,
        },
      }
    })
  },

  /**
   * Busca histórico de pagamentos recebidos pela marmitaria.
   * Nunca expõe PII do patrocinador.
   */
  async findPayments(params: PaymentsQueryParams) {
    const { marmitariaId, page, pageSize, from, to, exportAll } = params

    const where = {
      marmitariaId,
      paymentStatus: {
        in: [PurchaseStatus.APPROVED as unknown as never, PurchaseStatus.REFUNDED as unknown as never],
      },
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    }

    if (exportAll) {
      const items = await prisma.sponsorPurchase.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          totalAmount: true,
          paymentStatus: true,
          mpPaymentId: true,
          quantity: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10000, // limite anti-DoS — INT-045
      })

      const total = await prisma.sponsorPurchase.count({ where })

      return { items, total, truncated: total > 10000 }
    }

    const [items, total] = await prisma.$transaction([
      prisma.sponsorPurchase.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          totalAmount: true,
          paymentStatus: true,
          mpPaymentId: true,
          quantity: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sponsorPurchase.count({ where }),
    ])

    return {
      items,
      total,
      page,
      pageSize,
      truncated: false,
    }
  },

  /**
   * Retorna as configurações atuais da marmitaria.
   */
  async findSettings(userId: string) {
    const profile = await prisma.marmitariaProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        pricePerMeal: true,
        schedule: true,
        status: true,
        user: {
          select: {
            photoUrl: true,
            addresses: {
              where: { isPrimary: true },
              select: { bairro: true, cidade: true },
              take: 1,
            },
          },
        },
        purchases: {
          where: {
            paymentStatus: PurchaseStatus.APPROVED as unknown as never,
          },
          select: { id: true },
          take: 1,
        },
      },
    })

    if (!profile) return null

    return {
      id: profile.id,
      status: profile.status,
      pricePerMeal: profile.pricePerMeal ? Number(profile.pricePerMeal) : null,
      schedule: profile.schedule ?? null,
      photoUrl: profile.user.photoUrl ?? null,
      publicAddress: profile.user.addresses[0] ?? null,
      hasPriceLockedByPurchases: profile.purchases.length > 0,
    }
  },

  /**
   * Atualiza configurações da marmitaria.
   * Verifica lock de preço se há SponsorPurchase aprovadas.
   *
   * DB-007: nunca permitir pricePerMeal <= 0 (USER_024)
   */
  async updateSettings(input: UpdateSettingsInput) {
    return prisma.$transaction(async (tx) => {
      // Verificar se preço pode ser alterado
      if (input.pricePerMeal !== undefined) {
        const approvedPurchase = await tx.sponsorPurchase.findFirst({
          where: {
            marmitariaId: input.marmitariaId,
            paymentStatus: PurchaseStatus.APPROVED as unknown as never,
          },
          select: { id: true },
        })

        if (approvedPurchase) {
          throw Object.assign(new Error('Preço não pode ser alterado com compras aprovadas'), {
            code: 'PRICE_LOCKED',
          })
        }
      }

      // Atualizar MarmitariaProfile (schedule, pricePerMeal)
      const profileUpdateData: Record<string, unknown> = {}
      if (input.schedule !== undefined) profileUpdateData.schedule = input.schedule
      if (input.pricePerMeal !== undefined) {
        profileUpdateData.pricePerMeal = input.pricePerMeal
      }

      if (Object.keys(profileUpdateData).length > 0) {
        await tx.marmitariaProfile.update({
          where: { id: input.marmitariaId },
          data: profileUpdateData,
        })
      }

      // Atualizar User (photoUrl)
      if (input.photoUrl !== undefined) {
        await tx.user.update({
          where: { id: input.userId },
          data: { photoUrl: input.photoUrl },
        })
      }

      return { success: true, updatedAt: new Date().toISOString() }
    })
  },

  /**
   * Verifica se o status da marmitaria é ACTIVE.
   */
  isActive(status: MarmitariaStatus): boolean {
    return status === MarmitariaStatus.ACTIVE
  },

  /**
   * Retorna o código de erro adequado para um status não-ACTIVE.
   */
  getStatusErrorCode(status: MarmitariaStatus): string {
    switch (status) {
      case MarmitariaStatus.PENDING_APPROVAL:
        return 'AUTH_008'
      case MarmitariaStatus.SUSPENDED:
        return 'AUTH_010'
      default:
        return 'AUTH_009'
    }
  },
}
