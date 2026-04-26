/**
 * MarmitariaSettingsService — lógica de negócio para configurações da marmitaria.
 * @see module-14-painel-marmitaria/TASK-4/ST002
 *
 * INT-046: Configurações | INT-101: Horários
 * USER_023: Foto obrigatória | USER_024: Preço mínimo | USER_025: Dias obrigatórios
 */

import { revalidatePath } from 'next/cache'
import { marmitariaRepository } from '@/repositories/marmitaria.repository'
import type { SettingsUpdateInput } from '@/schemas/marmitaria.schema'
import { prisma } from '@/lib/prisma'
import { MarmitariaStatus } from '@/types/enums'

// ---------------------------------------------------------------------------
// Erros de domínio
// ---------------------------------------------------------------------------

export class PriceLockedError extends Error {
  code = 'PRICE_LOCKED'
  constructor() {
    super('Preço não pode ser alterado pois há patrocinadores com compras aprovadas.')
    this.name = 'PriceLockedError'
  }
}

export class PhotoRequiredError extends Error {
  code = 'PHOTO_REQUIRED'
  constructor() {
    super('Foto obrigatória para marmitarias. O patrocinador precisa identificar visualmente onde está comprando.')
    this.name = 'PhotoRequiredError'
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class MarmitariaSettingsService {
  /**
   * Busca as configurações atuais da marmitaria para popular o formulário.
   */
  async getSettings(userId: string) {
    const settings = await marmitariaRepository.findSettings(userId)
    return settings
  }

  /**
   * Atualiza as configurações da marmitaria.
   * Valida USER_023 (foto), USER_024 (preço), USER_025 (dias — validado no schema Zod).
   * Invalida cache da listagem pública após atualização.
   */
  async updateSettings(
    userId: string,
    marmitariaId: string,
    input: SettingsUpdateInput,
    currentPhotoUrl: string | null
  ) {
    // USER_023: foto obrigatória — se não há foto atual e não está enviando uma nova
    if (!currentPhotoUrl && !input.photoUrl) {
      throw new PhotoRequiredError()
    }

    // USER_024: preço não pode ser zero ou negativo (validado no schema, mas dupla verificação)
    if (input.pricePerMeal !== undefined && input.pricePerMeal <= 0) {
      throw Object.assign(new Error('Preço inválido: deve ser maior que zero'), {
        code: 'INVALID_PRICE',
      })
    }

    // Executar atualização (verifica lock de preço internamente — repository)
    try {
      const result = await marmitariaRepository.updateSettings({
        marmitariaId,
        userId,
        schedule: input.schedule,
        pricePerMeal: input.pricePerMeal,
        photoUrl: input.photoUrl,
        description: input.description,
        publicAddress: input.publicAddress,
      })

      // Invalidar cache da listagem pública (INT-046 — INT-035)
      revalidatePath('/marmitarias')
      revalidatePath('/api/v1/marmitarias/public')

      return result
    } catch (err: unknown) {
      const error = err as { code?: string }
      if (error?.code === 'PRICE_LOCKED') {
        throw new PriceLockedError()
      }
      throw err
    }
  }

  /**
   * TASK-1 / CL-262 — Pausa a marmitaria (suspende recebimento de novos patrocinios).
   * Idempotente. Grava audit log.
   */
  async pauseMarmitaria(userId: string, reason?: string) {
    const profile = await prisma.marmitariaProfile.findUnique({ where: { userId }, select: { id: true, status: true } })
    if (!profile) throw Object.assign(new Error('Marmitaria nao encontrada'), { code: 'AUTH_008' })
    if (profile.status === MarmitariaStatus.PAUSED) {
      return { isPaused: true, pausedAt: new Date().toISOString() }
    }
    if (profile.status !== MarmitariaStatus.ACTIVE) {
      throw Object.assign(new Error('Marmitaria precisa estar ACTIVE para pausar'), { code: 'INVALID_STATE' })
    }
    const updated = await prisma.marmitariaProfile.update({
      where: { id: profile.id },
      data: { status: MarmitariaStatus.PAUSED, pausedAt: new Date() },
      select: { pausedAt: true },
    })
    await prisma.auditLog.create({
      data: { userId, action: 'marmitaria_paused', entityType: 'MarmitariaProfile', entityId: profile.id, metadata: reason ? { reason } : undefined },
    })
    revalidatePath('/marmitarias')
    revalidatePath('/patrocinar')
    return { isPaused: true, pausedAt: updated.pausedAt?.toISOString() ?? null }
  }

  async resumeMarmitaria(userId: string) {
    const profile = await prisma.marmitariaProfile.findUnique({ where: { userId }, select: { id: true, status: true } })
    if (!profile) throw Object.assign(new Error('Marmitaria nao encontrada'), { code: 'AUTH_008' })
    if (profile.status === MarmitariaStatus.ACTIVE) {
      return { isPaused: false, pausedAt: null }
    }
    if (profile.status !== MarmitariaStatus.PAUSED) {
      throw Object.assign(new Error('Marmitaria nao esta PAUSED'), { code: 'INVALID_STATE' })
    }
    await prisma.marmitariaProfile.update({
      where: { id: profile.id },
      data: { status: MarmitariaStatus.ACTIVE, pausedAt: null },
    })
    await prisma.auditLog.create({
      data: { userId, action: 'marmitaria_resumed', entityType: 'MarmitariaProfile', entityId: profile.id },
    })
    revalidatePath('/marmitarias')
    revalidatePath('/patrocinar')
    return { isPaused: false, pausedAt: null }
  }

  async isPaused(userId: string): Promise<boolean> {
    const profile = await prisma.marmitariaProfile.findUnique({ where: { userId }, select: { status: true } })
    return profile?.status === MarmitariaStatus.PAUSED
  }
}

export const marmitariaSettingsService = new MarmitariaSettingsService()
