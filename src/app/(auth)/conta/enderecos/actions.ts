'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getServerSession } from '@/lib/auth/session'
import { addressRepository } from '@/repositories/address.repository'

const MAX_ADDRESSES = 5

const addressFormSchema = z.object({
  cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
  logradouro: z.string().min(1, 'Logradouro obrigatório'),
  numero: z.string().min(1, 'Número obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro obrigatório'),
  cidade: z.string().min(1, 'Cidade obrigatória'),
  estado: z.string().length(2, 'Estado obrigatório (2 letras)'),
})

export async function addAddressAction(
  formData: unknown
): Promise<{ success: boolean; error?: string; errorCode?: string }> {
  const session = await getServerSession()
  if (!session) return { success: false, error: 'Sessão expirada.', errorCode: 'AUTH_001' }

  const parsed = addressFormSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const count = await addressRepository.findByUserId(session.id).then((a) => a.length)
  if (count >= MAX_ADDRESSES) {
    return {
      success: false,
      error: 'Limite de 5 endereços atingido.',
      errorCode: 'ADDRESS_LIMIT_EXCEEDED',
    }
  }

  const data = parsed.data
  await addressRepository.create({
    user: { connect: { id: session.id } },
    cep: data.cep,
    logradouro: data.logradouro,
    numero: data.numero,
    complemento: data.complemento ?? null,
    bairro: data.bairro,
    cidade: data.cidade,
    estado: data.estado,
    isPrimary: count === 0,
  })

  revalidatePath('/conta/enderecos')
  return { success: true }
}

export async function updateAddressAction(
  addressId: string,
  formData: unknown
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession()
  if (!session) return { success: false, error: 'Sessão expirada.' }

  // Ownership check
  const address = await addressRepository.findById(addressId)
  if (!address || address.userId !== session.id) {
    return { success: false, error: 'Acesso negado.' }
  }

  const parsed = addressFormSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const data = parsed.data
  await addressRepository.update(addressId, {
    cep: data.cep,
    logradouro: data.logradouro,
    numero: data.numero,
    complemento: data.complemento ?? null,
    bairro: data.bairro,
    cidade: data.cidade,
    estado: data.estado,
  })

  revalidatePath('/conta/enderecos')
  return { success: true }
}

export async function deleteAddressAction(
  addressId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession()
  if (!session) return { success: false, error: 'Sessão expirada.' }

  const address = await addressRepository.findById(addressId)
  if (!address || address.userId !== session.id) {
    return { success: false, error: 'Acesso negado.' }
  }

  await addressRepository.delete(addressId)
  revalidatePath('/conta/enderecos')
  return { success: true }
}
