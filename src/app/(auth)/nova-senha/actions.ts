'use server'
/**
 * Server Actions para o fluxo de redefinição de senha.
 * @see module-5-auth-recovery/TASK-2/ST004
 */
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { auditLogRepository } from '@/repositories/audit-log.repository'
import { resetPasswordSchema } from '@/lib/auth/recovery-types'
import type { ActionResult } from '@/lib/auth/recovery-types'

/**
 * Redefine a senha do usuário autenticado via token de reset.
 *
 * Pré-requisito: sessão ativa setada pelo callback do Supabase (/api/auth/callback).
 *
 * Segurança:
 * - Verifica sessão ativa antes de atualizar (protege contra replay)
 * - Invalida todas as outras sessões ativas após reset (scope: 'others')
 * - Registra PASSWORD_RESET_COMPLETED no audit_log (LLD §8.2)
 * - Nunca loga a nova senha
 * - Token é one-time use — invalidado pelo Supabase após uso
 */
export async function resetPasswordAction(
  password: string,
  confirmPassword: string
): Promise<ActionResult> {
  // 1. Validar senha no servidor (defesa em profundidade)
  const parsed = resetPasswordSchema.safeParse({ password, confirmPassword })
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path[0] as string)
    return { success: false, error: 'VAL_003', fields }
  }

  const supabase = await createSupabaseServerClient()

  // 2. Verificar sessão ativa (protege contra token replay)
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()

  if (sessionError || !user) {
    return { success: false, error: 'AUTH_001' }
  }

  // 3. Atualizar senha
  const { error: updateError } = await supabase.auth.updateUser({ password })
  if (updateError) {
    if (updateError.message?.includes('expired') || updateError.message?.includes('invalid')) {
      return { success: false, error: 'AUTH_001' }
    }
    return { success: false, error: 'SYS_001' }
  }

  // 4. Invalidar todas as outras sessões (segurança pós-reset)
  await supabase.auth.signOut({ scope: 'others' }).catch(() => {})

  // 5. Audit log
  await auditLogRepository.log('PASSWORD_RESET_COMPLETED', 'User', {
    userId: user.id,
    entityId: user.id,
  })

  return { success: true }
}
