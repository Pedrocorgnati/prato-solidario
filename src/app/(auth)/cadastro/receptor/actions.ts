'use server'

import { headers } from 'next/headers'
import { userService } from '@/services/user.service'
import { recordConsent } from '@/services/consent.service'
import { sanitizeRegistrationError } from '@/services/register.service'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { registerReceptorSchema } from '@/types/register.types'
import type { RegisterResult } from '@/types/register.types'

/**
 * Server Action: cadastro de Receptor (cadastro opcional — Should).
 *
 * Nota de UX: o cadastro é opcional — receptores podem retirar alimentos
 * apresentando apenas um código (INT-034). O cadastro permite histórico.
 *
 * Fluxo:
 * 1. Valida input com Zod
 * 2. Cria usuário Supabase Auth + User Prisma com role RECEPTOR
 * 3. Registra consentimento LGPD (base legal: contrato — usuário escolheu criar conta)
 * 4. Envia e-mail de verificação (NOTIF-001)
 *
 * @see module-4-auth-register/TASK-6/ST002
 * @see INT-034: receptor pode operar sem cadastro (código de retirada)
 */
export async function registerReceptorAction(
  rawData: unknown
): Promise<RegisterResult> {
  const parsed = registerReceptorSchema.safeParse(rawData)
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
    const user = await userService.createReceptor(
      {
        email: data.email,
        password: data.password,
        location: data.cep ?? '',
      },
      ipAddress
    )
    userId = user.id

    // Atualiza nome (createReceptor usa email como nome por padrão)
    // TODO: adicionar campo `name` ao CreateReceptorInput quando UserService for atualizado

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
