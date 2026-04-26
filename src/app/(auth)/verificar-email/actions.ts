'use server'
/**
 * Server Actions para o fluxo de verificação de e-mail.
 * @see module-5-auth-recovery/TASK-1/ST002
 */
import crypto from 'crypto'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { ActionResult } from '@/lib/auth/recovery-types'
import { RESEND_VERIFICATION_COOLDOWN_S } from '@/lib/auth/recovery-types'

const emailSchema = z.string().email()

function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 32)
}

/**
 * Reenvia o e-mail de verificação para o endereço informado.
 *
 * Segurança:
 * - Rate limit server-side: 1 reenvio por e-mail a cada 60s (via AuditLog)
 * - Nunca revela se o e-mail está cadastrado (resposta ambígua intencional)
 * - Nunca loga o e-mail em plain text
 */
export async function resendVerificationAction(email: string): Promise<ActionResult> {
  // 1. Validar formato do e-mail
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) {
    return { success: false, error: 'VAL_001' }
  }

  const emailHash = hashEmail(email)
  const windowStart = new Date(Date.now() - RESEND_VERIFICATION_COOLDOWN_S * 1000)

  // 2. Rate limit: verificar reenvio recente via AuditLog
  const recentResend = await prisma.auditLog.findFirst({
    where: {
      action: 'VERIFICATION_RESENT',
      entityType: 'User',
      createdAt: { gte: windowStart },
      metadata: { path: ['emailHash'], equals: emailHash },
    },
  })

  if (recentResend) {
    const retryAfterMs = recentResend.createdAt.getTime() + RESEND_VERIFICATION_COOLDOWN_S * 1000 - Date.now()
    const retryAfter = Math.max(1, Math.ceil(retryAfterMs / 1000))
    return { success: false, error: 'AUTH_006', retryAfter }
  }

  // 3. Chamar Supabase (nunca revelar se o e-mail existe — resposta ambígua)
  const supabase = await createSupabaseServerClient()
  await supabase.auth.resend({ type: 'signup', email }).catch(() => {})

  // 4. Registrar tentativa para rate limit
  await prisma.auditLog.create({
    data: {
      action: 'VERIFICATION_RESENT',
      entityType: 'User',
      metadata: { emailHash } as import('@prisma/client').Prisma.InputJsonValue,
    },
  })

  return { success: true }
}
