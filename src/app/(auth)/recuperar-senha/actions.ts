'use server'
/**
 * Server Actions para o fluxo de solicitação de reset de senha.
 * @see module-5-auth-recovery/TASK-2/ST002
 */
import crypto from 'crypto'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { recoverPasswordSchema } from '@/lib/auth/recovery-types'
import type { ActionResult } from '@/lib/auth/recovery-types'
import { PASSWORD_RESET_COOLDOWN_MIN } from '@/lib/auth/recovery-types'
import { env } from '@/lib/env'

function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 32)
}

/**
 * Solicita envio de link de reset de senha.
 *
 * Segurança:
 * - Rate limit: 1 solicitação por e-mail a cada 15min (via AuditLog)
 * - Resposta ambígua: sempre retorna success=true independente do e-mail existir (US-023)
 * - Nunca loga o e-mail em plain text
 * - redirectTo validado — usa APP_URL da env (não aceita valor externo)
 */
export async function requestPasswordResetAction(email: string): Promise<ActionResult> {
  // 1. Validar formato do e-mail
  const parsed = recoverPasswordSchema.safeParse({ email })
  if (!parsed.success) {
    return { success: false, error: 'VAL_001' }
  }

  const emailHash = hashEmail(email)
  const windowStart = new Date(Date.now() - PASSWORD_RESET_COOLDOWN_MIN * 60 * 1000)

  // 2. Rate limit: verificar solicitação recente via AuditLog
  const recentRequest = await prisma.auditLog.findFirst({
    where: {
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      createdAt: { gte: windowStart },
      metadata: { path: ['emailHash'], equals: emailHash },
    },
  })

  if (recentRequest) {
    const retryAfterMs =
      recentRequest.createdAt.getTime() + PASSWORD_RESET_COOLDOWN_MIN * 60 * 1000 - Date.now()
    const retryAfter = Math.max(1, Math.ceil(retryAfterMs / 60))
    return { success: false, error: 'AUTH_006', retryAfter }
  }

  // 3. Registrar tentativa antes de chamar Supabase (rate limit proativo)
  await prisma.auditLog.create({
    data: {
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'User',
      metadata: { emailHash } as import('@prisma/client').Prisma.InputJsonValue,
    },
  })

  // 4. Chamar Supabase (nunca revelar se o e-mail existe — US-023)
  const supabase = await createSupabaseServerClient()
  await supabase.auth
    .resetPasswordForEmail(email, {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/nova-senha`,
    })
    .catch(() => {})

  // 5. Resposta ambígua — sempre sucesso visível ao usuário
  return { success: true }
}
