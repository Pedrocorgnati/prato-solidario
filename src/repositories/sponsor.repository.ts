/**
 * SponsorRepository — operações de banco para SponsorPurchase e SponsoredMeal.
 * @see module-13-sponsor-checkout/TASK-1/ST002
 *
 * INT-034: Guest checkout | INT-039: Créditos automáticos | INT-100: Sem expiração
 */

import { prisma } from '@/lib/prisma'
import { PaymentMethod, PurchaseStatus, SponsoredMealStatus } from '@/types/enums'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreatePurchaseInput {
  sponsorId: string | null
  guestEmail: string | null
  marmitariaId: string
  quantity: number
  unitPrice: number
  totalAmount: number
  paymentMethod: PaymentMethod
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export const sponsorRepository = {
  /**
   * Cria SponsorPurchase com status PENDING.
   * Retorna o registro criado com o ID (usado como external_reference para o MP).
   */
  async createPurchase(data: CreatePurchaseInput) {
    return prisma.sponsorPurchase.create({
      data: {
        sponsorId: data.sponsorId,
        guestEmail: data.guestEmail,
        marmitariaId: data.marmitariaId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod as unknown as never,
        paymentStatus: PurchaseStatus.PENDING as unknown as never,
      },
    })
  },

  /**
   * Busca compra por ID (para webhook, histórico e tela de sucesso).
   */
  async findPurchaseById(id: string) {
    return prisma.sponsorPurchase.findUnique({
      where: { id },
      include: {
        marmitaria: { select: { id: true, tradeName: true, pricePerMeal: true } },
      },
    })
  },

  /**
   * Histórico paginado por usuário autenticado (Should — INT-041).
   */
  async findPurchasesByUser(
    userId: string,
    page: number,
    pageSize: number
  ): Promise<{ items: Awaited<ReturnType<typeof prisma.sponsorPurchase.findMany>>; total: number }> {
    // Busca SponsorProfile para obter o ID do perfil
    const profile = await prisma.sponsorProfile.findUnique({
      where: { userId },
      select: { id: true },
    })

    if (!profile) return { items: [], total: 0 }

    const [items, total] = await prisma.$transaction([
      prisma.sponsorPurchase.findMany({
        where: { sponsorId: profile.id },
        include: {
          marmitaria: { select: { tradeName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sponsorPurchase.count({ where: { sponsorId: profile.id } }),
    ])

    return { items, total }
  },

  /**
   * Calcula total investido pelo usuário (soma de compras APPROVED).
   */
  async getTotalInvested(userId: string): Promise<number> {
    const profile = await prisma.sponsorProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!profile) return 0

    const result = await prisma.sponsorPurchase.aggregate({
      where: {
        sponsorId: profile.id,
        paymentStatus: PurchaseStatus.APPROVED as unknown as never,
      },
      _sum: { totalAmount: true },
    })

    return Number(result._sum.totalAmount ?? 0)
  },

  /**
   * Cria N registros SponsoredMeal após pagamento APPROVED.
   * expiresAt = null — créditos não expiram (INT-100).
   */
  async creditMeals(
    marmitariaId: string,
    quantity: number,
    purchaseId: string
  ) {
    const meals = Array.from({ length: quantity }).map(() => ({
      purchaseId,
      marmitariaId,
      status: SponsoredMealStatus.AVAILABLE as unknown as never,
      expiresAt: null, // INT-100: créditos não expiram
    }))

    return prisma.sponsoredMeal.createMany({ data: meals })
  },

  /**
   * Busca refeições disponíveis para uma marmitaria.
   */
  async getAvailableMeals(marmitariaId: string) {
    return prisma.sponsoredMeal.findMany({
      where: {
        marmitariaId,
        status: SponsoredMealStatus.AVAILABLE as unknown as never,
      },
      orderBy: { createdAt: 'asc' },
    })
  },

  /**
   * Reserva uma refeição (de AVAILABLE para RESERVED).
   */
  async reserveMeal(id: string) {
    return prisma.sponsoredMeal.update({
      where: { id },
      data: { status: SponsoredMealStatus.RESERVED as unknown as never },
    })
  },

  /**
   * Marca refeição como entregue (de RESERVED para DELIVERED).
   */
  async markDelivered(id: string) {
    return prisma.sponsoredMeal.update({
      where: { id },
      data: { status: SponsoredMealStatus.DELIVERED as unknown as never },
    })
  },

  /**
   * Atualiza status de pagamento — chamado pelo webhook de module-12.
   * Usa SponsorPurchase.id como identificador (external_reference = purchase.id).
   */
  async updatePurchaseStatus(
    purchaseId: string,
    status: PurchaseStatus,
    mpPaymentId: string
  ) {
    return prisma.sponsorPurchase.update({
      where: { id: purchaseId },
      data: {
        paymentStatus: status as unknown as never,
        mpPaymentId,
      },
    })
  },
}
