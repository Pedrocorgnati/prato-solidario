import { prisma } from '@/lib/prisma'
import { auditLogRepository } from '@/repositories/audit-log.repository'
import * as profileRepository from '@/repositories/profile.repository'
import type { User } from '@prisma/client'
import type { ProfileUpdateData, LGPDServiceResult } from '@/types/lgpd.types'

/**
 * ProfileService — edição de perfil de usuário.
 * @see module-6-profile-lgpd/TASK-1/ST002
 */

export interface ProfileWithRestaurant extends User {
  restaurantProfile: { tradeName: string } | null
  ongProfile: { cnpj: string; areaAtuacao: string | null; descricao: string | null } | null
  sponsorProfile: { companyName: string | null; cnpj: string | null; companyDescription: string | null } | null
}

/**
 * Retorna perfil do usuário com dados de restaurante (se existir).
 */
export async function getProfileByUserId(
  userId: string
): Promise<ProfileWithRestaurant | null> {
  return profileRepository.findByUserId(userId) as Promise<ProfileWithRestaurant | null>
}

/**
 * Atualiza nome, telefone e/ou foto do usuário em transação.
 * Registra AuditLog com campos alterados (sem valores antigos).
 */
export async function updateProfile(
  userId: string,
  data: ProfileUpdateData & {
    tradeName?: string
    areaAtuacao?: string
    descricao?: string
    companyName?: string
    companyDescription?: string
  }
): Promise<LGPDServiceResult> {
  const changedFields: string[] = []
  if (data.name !== undefined) changedFields.push('name')
  if (data.phone !== undefined) changedFields.push('phone')
  if (data.photoUrl !== undefined) changedFields.push('photoUrl')
  if (data.tradeName !== undefined) changedFields.push('tradeName')
  if (data.areaAtuacao !== undefined) changedFields.push('areaAtuacao')
  if (data.descricao !== undefined) changedFields.push('descricao')
  if (data.companyName !== undefined) changedFields.push('companyName')
  if (data.companyDescription !== undefined) changedFields.push('companyDescription')

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
      },
    })

    if (data.tradeName !== undefined) {
      await tx.restaurantProfile.updateMany({
        where: { userId },
        data: { tradeName: data.tradeName },
      })
    }

    if (data.areaAtuacao !== undefined || data.descricao !== undefined) {
      await tx.ongProfile.updateMany({
        where: { userId },
        data: {
          ...(data.areaAtuacao !== undefined && { areaAtuacao: data.areaAtuacao }),
          ...(data.descricao !== undefined && { descricao: data.descricao }),
        },
      })
    }

    if (data.companyName !== undefined || data.companyDescription !== undefined) {
      await tx.sponsorProfile.updateMany({
        where: { userId },
        data: {
          ...(data.companyName !== undefined && { companyName: data.companyName }),
          ...(data.companyDescription !== undefined && { companyDescription: data.companyDescription }),
        },
      })
    }
  })

  await auditLogRepository.log('PROFILE_UPDATED', 'User', {
    userId,
    entityId: userId,
    metadata: { changedFields },
  })

  return { success: true }
}
