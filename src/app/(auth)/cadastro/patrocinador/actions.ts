'use server'

import { headers } from 'next/headers'
import { userService } from '@/services/user.service'
import { recordConsent } from '@/services/consent.service'
import { sanitizeRegistrationError } from '@/services/register.service'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { registerPatrocinadorSchema } from '@/types/register.types'
import type { RegisterResult } from '@/types/register.types'

/**
 * Server Action: cadastro de Patrocinador (2 etapas — Should).
 *
 * Fluxo:
 * 1. Valida input com Zod
 * 2. Cria usuário Supabase Auth + User Prisma com role PATROCINADOR
 * 3. Registra consentimento LGPD
 * 4. Envia e-mail de verificação (NOTIF-001)
 *
 * Nota: CPF ou CNPJ conforme sponsorType (PF → CPF, EMPRESA → CNPJ).
 *
 * @see module-4-auth-register/TASK-6/ST001
 */
export async function registerPatrocinadorAction(
  rawData: unknown
): Promise<RegisterResult> {
  const parsed = registerPatrocinadorSchema.safeParse(rawData)
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
    const user = await userService.createSponsor(
      {
        name: data.name,
        email: data.email,
        password: data.password,
      },
      ipAddress
    )
    userId = user.id

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
