'use server'

import { headers } from 'next/headers'
import { userService } from '@/services/user.service'
import { recordConsent } from '@/services/consent.service'
import { sanitizeRegistrationError } from '@/services/register.service'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { registerOngSchema } from '@/types/register.types'
import type { RegisterResult } from '@/types/register.types'

/**
 * Server Action: cadastro de ONG (3 etapas).
 *
 * Fluxo:
 * 1. Valida input com Zod
 * 2. Cria usuário Supabase Auth + User Prisma com role ONG
 * 3. Registra consentimento LGPD + declaração jurídica
 * 4. Envia e-mail de verificação (NOTIF-001)
 *
 * Nota de negócio: ONG é isenta de bloqueio de IP (INT-013).
 * Conta fica inativa (email_confirm: false) até verificação.
 *
 * @see module-4-auth-register/TASK-4/ST004
 */
export async function registerOngAction(
  rawData: unknown
): Promise<RegisterResult> {
  const parsed = registerOngSchema.safeParse(rawData)
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
    const user = await userService.createONG(
      {
        name: data.razaoSocial,
        email: data.email,
        password: data.password,
        // CNPJ como document principal da ONG
        document: data.cnpj,
        termsAccepted: true,
      },
      ipAddress
    )
    userId = user.id

    // Registra dois tipos de consentimento: termos e declaração jurídica
    await recordConsent({
      userId,
      ipAddress,
      userAgent,
      consentType: 'TERMS_AND_PRIVACY',
    })
    await recordConsent({
      userId,
      ipAddress,
      userAgent,
      consentType: 'ONG_LEGAL_DECLARATION',
    })

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
