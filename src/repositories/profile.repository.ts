import { addressRepository } from '@/repositories/address.repository'
import { prisma } from '@/lib/prisma'
import type { Address, User, Prisma } from '@prisma/client'
import type { AddressBrInput } from '@/types/register.types'
import type { ProfileUpdateData } from '@/types/lgpd.types'

/**
 * Repositório de perfis de usuário.
 * @see module-4-auth-register/TASK-0/ST004
 * @see module-6-profile-lgpd/TASK-0/ST003, TASK-1/ST002
 */

// ---------------------------------------------------------------------------
// Legado module-4 — mantido para compatibilidade
// ---------------------------------------------------------------------------

export async function createPrimaryAddress(
  userId: string,
  address: AddressBrInput,
  coords?: { lat: number; lng: number }
): Promise<Address> {
  return addressRepository.create({
    user: { connect: { id: userId } },
    cep: address.cep.replace(/\D/g, ''),
    logradouro: address.logradouro,
    numero: address.numero,
    complemento: address.complemento ?? null,
    bairro: address.bairro,
    cidade: address.cidade,
    estado: address.estado,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    isPrimary: true,
  })
}

// ---------------------------------------------------------------------------
// module-6 — Perfil
// ---------------------------------------------------------------------------

export type UserWithProfile = User & {
  restaurantProfile?: { tradeName: string } | null
}

/**
 * Busca usuário com perfil de restaurante (se existir).
 */
export async function findByUserId(userId: string): Promise<UserWithProfile | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { restaurantProfile: { select: { tradeName: true } } },
  })
}

/**
 * Atualiza campos de perfil do usuário.
 */
export async function update(
  userId: string,
  data: Prisma.UserUpdateInput
): Promise<User> {
  return prisma.user.update({ where: { id: userId }, data })
}
