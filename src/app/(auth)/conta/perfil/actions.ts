'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getServerSession } from '@/lib/auth/session'
import { updateProfile } from '@/services/profile.service'

const baseSchema = z.object({
  name: z.string().min(2, 'Nome completo deve ter no mínimo 2 caracteres').max(255).optional(),
  phone: z
    .string()
    .regex(/^\+55\d{10,11}$/, 'Telefone inválido (use +55 + DDD + número)')
    .optional()
    .or(z.literal('')),
  photoUrl: z.string().url().optional().or(z.literal('')),
  tradeName: z.string().min(2).max(255).optional(),
  // ONG fields
  areaAtuacao: z.string().max(100).optional(),
  descricao: z.string().max(500).optional(),
  // Sponsor fields
  companyName: z.string().max(255).optional(),
  companyDescription: z.string().max(500).optional(),
})

export async function updateProfileAction(
  formData: unknown
): Promise<{ success: boolean; error?: string; errorCode?: string }> {
  const session = await getServerSession()
  if (!session) return { success: false, error: 'Sessão expirada. Faça login novamente.', errorCode: 'AUTH_001' }

  const parsed = baseSchema.safeParse(formData)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError?.message ?? 'Dados inválidos.' }
  }

  const data = parsed.data
  const role = session.role as string

  // Normalizar phone vazio → null
  const profileData: Parameters<typeof updateProfile>[1] = {
    ...(data.name && { name: data.name }),
    ...(data.phone !== undefined && { phone: data.phone || null }),
    ...(data.photoUrl && { photoUrl: data.photoUrl }),
  }

  // Campos por role — rejeitar silenciosamente campos não autorizados
  if (role === 'DOADOR_RESTAURANTE' && data.tradeName) {
    profileData.tradeName = data.tradeName
  }

  if (role === 'ONG') {
    if (data.areaAtuacao !== undefined) profileData.areaAtuacao = data.areaAtuacao
    if (data.descricao !== undefined) profileData.descricao = data.descricao
  }

  if (role === 'SPONSOR' || role === 'PATROCINADOR') {
    if (data.companyName !== undefined) profileData.companyName = data.companyName
    if (data.companyDescription !== undefined) profileData.companyDescription = data.companyDescription
    // cnpj: bloqueado no FE (disabled) — não aceitar update via action
  }

  const result = await updateProfile(session.id, profileData)

  if (result.success) {
    revalidatePath('/conta/perfil')
  }

  return result
}
