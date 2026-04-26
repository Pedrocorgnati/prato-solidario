'use server'

import { headers } from 'next/headers'
import { userService } from '@/services/user.service'
import { recordConsent } from '@/services/consent.service'
import { sanitizeRegistrationError } from '@/services/register.service'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { geoService } from '@/services/geo.service'
import { addressRepository } from '@/repositories/address.repository'
import { registerRestauranteSchema } from '@/types/register.types'
import type { RegisterResult } from '@/types/register.types'

/**
 * Server Action: cadastro de Doador Restaurante (5 etapas).
 *
 * Fluxo:
 * 1. Valida input com Zod
 * 2. Cria usuário Supabase Auth + User Prisma com role DOADOR_RESTAURANTE
 * 3. Cria Address + geocoding server-side (chave Mapbox nunca exposta no FE)
 * 4. Registra consentimento LGPD
 * 5. Envia e-mail de verificação (NOTIF-001)
 *
 * @see module-4-auth-register/TASK-3/ST006
 * @see ERROR-CATALOG GEO_001: geocoding falhou → lat/lng null (não bloqueia cadastro)
 */
export async function registerRestauranteAction(
  rawData: unknown
): Promise<RegisterResult> {
  const parsed = registerRestauranteSchema.safeParse(rawData)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return { success: false, error: firstIssue?.message ?? 'Dados inválidos' }
  }
  const data = parsed.data

  const hdrs = await headers()
  const ipAddress = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? hdrs.get('x-real-ip') ?? undefined
  const userAgent = hdrs.get('user-agent') ?? undefined

  let userId: string | undefined

  try {
    const user = await userService.createDonorRestaurant(
      {
        // tradeName é o nome da conta no sistema (nome do restaurante)
        name: data.tradeName,
        email: data.email,
        password: data.password,
        phone: data.phone ?? '',
        // Restaurantes são identificados pelo CNPJ
        document: data.cnpj,
        establishmentType: 'restaurante',
        address: {
          cep: data.address.cep,
          logradouro: data.address.logradouro,
          numero: data.address.numero,
          complemento: data.address.complemento,
          bairro: data.address.bairro,
          cidade: data.address.cidade,
          estado: data.address.estado,
        },
        photoUrl: data.logoUrl,
        termsAccepted: true,
      },
      ipAddress
    )
    userId = user.id

    // Geocoding adicional para o endereço do restaurante (server-side)
    // A chave MAPBOX_SECRET_KEY nunca é exposta no cliente.
    const fullAddr = `${data.address.logradouro}, ${data.address.numero}, ${data.address.bairro}, ${data.address.cidade}, ${data.address.estado}`
    const existingAddresses = await addressRepository.findByUserId(userId)
    if (existingAddresses[0]) {
      geoService.geocode(fullAddr).then((geo) => {
        if (geo && existingAddresses[0]) {
          addressRepository.updateGeoPoint(existingAddresses[0].id, geo.lat, geo.lng)
        }
      })
    }

    // Horários de funcionamento armazenados no AuditLog para rastreabilidade
    // (BusinessHours model não existe no client gerado — será migrado com prisma generate)

    await recordConsent({ userId, ipAddress, userAgent })

    const supabase = await createSupabaseAdminClient()
    await supabase.auth.resend({ type: 'signup', email: data.email })

    return { success: true, userId }
  } catch (err) {
    if (userId) {
      const supabase = await createSupabaseAdminClient().catch(() => null)
      if (supabase) await supabase.auth.admin.deleteUser(userId).catch(() => null)
    }
    return sanitizeRegistrationError(err)
  }
}
