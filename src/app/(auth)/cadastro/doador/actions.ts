'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { userService } from '@/services/user.service'
import { recordConsent } from '@/services/consent.service'
import { sanitizeRegistrationError } from '@/services/register.service'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { createPrimaryAddress } from '@/repositories/profile.repository'
import { geoService } from '@/services/geo.service'
import { addressRepository } from '@/repositories/address.repository'
import { registerDoadorPfSchema } from '@/types/register.types'
import type { RegisterResult } from '@/types/register.types'

/**
 * Server Action: cadastro de Doador Pessoa Física (3 etapas).
 *
 * Fluxo:
 * 1. Valida input com Zod
 * 2. Cria usuário no Supabase Auth (email_confirm: false)
 * 3. Cria User + Address no Prisma
 * 4. Registra consentimento LGPD via AuditLog
 * 5. Envia e-mail de verificação (NOTIF-001)
 *
 * Segurança: nunca revela se e-mail já existe (sanitizeRegistrationError).
 * @see module-4-auth-register/TASK-2/ST004
 * @see ERROR-CATALOG AUTH_001, VAL_001, VAL_002
 */
export async function registerDoadorPfAction(
  rawData: unknown
): Promise<RegisterResult> {
  // Validação de input
  const parsed = registerDoadorPfSchema.safeParse(rawData)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return { success: false, error: firstIssue?.message ?? 'Dados inválidos' }
  }
  const data = parsed.data

  // Extrai IP e User-Agent para LGPD
  const hdrs = await headers()
  const ipAddress = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? hdrs.get('x-real-ip') ?? undefined
  const userAgent = hdrs.get('user-agent') ?? undefined

  let userId: string | undefined

  try {
    // Cria usuário Supabase Auth + User Prisma
    const user = await userService.createDonorPF(
      {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone ?? '',
        termsAccepted: true,
      },
      ipAddress
    )
    userId = user.id

    // Cria endereço primário
    const address = await createPrimaryAddress(userId, data.address)

    // Geocoding assíncrono (não bloqueia resposta)
    const fullAddr = `${data.address.logradouro}, ${data.address.numero}, ${data.address.bairro}, ${data.address.cidade}`
    geoService.geocode(fullAddr).then((geo) => {
      if (geo) addressRepository.updateGeoPoint(address.id, geo.lat, geo.lng)
    })

    // Registra consentimento LGPD
    await recordConsent({ userId, ipAddress, userAgent })

    // Envia e-mail de verificação (NOTIF-001)
    const supabase = await createSupabaseAdminClient()
    await supabase.auth.resend({ type: 'signup', email: data.email })

    return { success: true, userId }
  } catch (err) {
    // Cleanup: remove usuário Supabase se Prisma falhou
    if (userId) {
      const supabase = await createSupabaseAdminClient().catch(() => null)
      if (supabase) {
        await supabase.auth.admin.deleteUser(userId).catch(() => null)
      }
    }
    return sanitizeRegistrationError(err)
  }
}
