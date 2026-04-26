/**
 * MarmitariaDeliveryService — lógica de negócio para confirmação de entrega de marmitas.
 * @see module-14-painel-marmitaria/TASK-2/ST002
 *
 * INT-043: Confirmação de entrega | Contrato-4: RetrievalCode | Contrato-6: MarmitariaStatus.ACTIVE
 * DB-007: Balance negative guard
 */

import { prisma } from '@/lib/prisma'
import { marmitariaRepository } from '@/repositories/marmitaria.repository'
import { SponsoredMealStatus, MarmitariaStatus } from '@/types/enums'

// ---------------------------------------------------------------------------
// Erros de domínio
// ---------------------------------------------------------------------------

export class MealNotFoundError extends Error {
  constructor(id: string) {
    super(`Marmita ${id} não encontrada.`)
    this.name = 'MealNotFoundError'
  }
}

export class MealOwnershipError extends Error {
  constructor() {
    super('Refeição não pertence a esta marmitaria.')
    this.name = 'MealOwnershipError'
  }
}

export class MealAlreadyDeliveredError extends Error {
  constructor() {
    super('Esta marmita já foi confirmada como entregue.')
    this.name = 'MealAlreadyDeliveredError'
  }
}

export class MealNotReservedError extends Error {
  constructor() {
    super('Marmita não está no estado correto para confirmação.')
    this.name = 'MealNotReservedError'
  }
}

export class MarmitariaNotActiveError extends Error {
  code: string
  constructor(status: MarmitariaStatus) {
    super('Marmitaria não está ativa.')
    this.name = 'MarmitariaNotActiveError'
    this.code =
      status === MarmitariaStatus.PENDING_APPROVAL
        ? 'AUTH_008'
        : status === MarmitariaStatus.SUSPENDED
          ? 'AUTH_010'
          : 'AUTH_009'
  }
}

export class InvalidCodeError extends Error {
  constructor() {
    super('Código de retirada inválido ou não encontrado.')
    this.name = 'InvalidCodeError'
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class MarmitariaDeliveryService {
  /**
   * Confirma a entrega de uma marmita pelo ID do SponsoredMeal.
   * Verifica ownership e status antes de confirmar.
   */
  async confirmById(
    mealId: string,
    marmitariaId: string,
    marmitariaStatus: MarmitariaStatus,
    userId: string
  ) {
    // 1. Verificar que marmitaria está ACTIVE (Contrato-6)
    if (marmitariaStatus !== MarmitariaStatus.ACTIVE) {
      throw new MarmitariaNotActiveError(marmitariaStatus)
    }

    // 2. Buscar meal
    const meal = await marmitariaRepository.findMealById(mealId)
    if (!meal) throw new MealNotFoundError(mealId)

    // 3. Verificar ownership (Contrato-6)
    if (meal.marmitariaId !== marmitariaId) throw new MealOwnershipError()

    // 4. Verificar status
    const status = meal.status as unknown as SponsoredMealStatus
    if (status === SponsoredMealStatus.DELIVERED) throw new MealAlreadyDeliveredError()
    if (status !== SponsoredMealStatus.RESERVED) throw new MealNotReservedError()

    // 5. Confirmar em transação atômica (DB-007 guard aplicado no repository)
    const result = await marmitariaRepository.confirmDelivery(mealId, marmitariaId, userId)

    return {
      success: true,
      mealId,
      deliveredAt: new Date().toISOString(),
      balanceUpdated: result.balanceUpdated,
    }
  }

  /**
   * Confirma a entrega de uma marmita usando o código de retirada mostrado pelo receptor.
   *
   * O código é validado para confirmar que o receptor está fisicamente presente.
   * Em seguida, a marmita RESERVED mais antiga desta marmitaria é confirmada.
   */
  async confirmByCode(
    code: string,
    marmitariaId: string,
    marmitariaStatus: MarmitariaStatus,
    userId: string
  ) {
    // 1. Verificar que marmitaria está ACTIVE
    if (marmitariaStatus !== MarmitariaStatus.ACTIVE) {
      throw new MarmitariaNotActiveError(marmitariaStatus)
    }

    // 2. Validar que o código existe e está ativo (pertence a uma doação SPONSORED)
    const retrievalCode = await prisma.retrievalCode.findUnique({
      where: { code },
      include: {
        donation: { select: { type: true, status: true } },
      },
    })

    if (!retrievalCode || retrievalCode.status !== 'ACTIVE') {
      throw new InvalidCodeError()
    }

    // 3. Buscar a marmita RESERVED mais antiga desta marmitaria
    const meal = await marmitariaRepository.findOldestReservedMeal(marmitariaId)
    if (!meal) throw new MealNotFoundError('no-reserved-meal')

    // 4. Confirmar em transação atômica
    const result = await marmitariaRepository.confirmDelivery(meal.id, marmitariaId, userId)

    return {
      success: true,
      mealId: meal.id,
      deliveredAt: new Date().toISOString(),
      balanceUpdated: result.balanceUpdated,
      confirmedByCode: code,
    }
  }
}

export const marmitariaDeliveryService = new MarmitariaDeliveryService()
