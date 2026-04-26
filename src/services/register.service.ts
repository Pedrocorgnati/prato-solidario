import type { RegisterResult } from '@/types/register.types'

/**
 * Serviço de registro — utilitários compartilhados pelos Server Actions de cadastro.
 * @see module-4-auth-register/TASK-0/ST003..ST005
 */

// ---------------------------------------------------------------------------
// Mensagem genérica de erro de cadastro
// Nunca revelar se e-mail já existe — proteção contra enumeração.
// @see TASK-0/ST005, ERROR-CATALOG AUTH_001, THREAT-MODEL T-REG-01
// ---------------------------------------------------------------------------

const GENERIC_REGISTER_ERROR =
  'Não foi possível criar a conta. Verifique seus dados e tente novamente.'

/**
 * Sanitiza erros de cadastro para nunca expor informações sensíveis ao cliente.
 * - Prisma P2002 (unique constraint) → mensagem genérica
 * - Supabase AuthError (email duplicado) → mensagem genérica
 * - Qualquer outro erro → SYS_001 genérico
 */
export function sanitizeRegistrationError(err: unknown): RegisterResult {
  if (err instanceof Error) {
    // Prisma unique constraint — e-mail, CPF ou CNPJ duplicado
    if (err.message.includes('P2002')) {
      console.error('[register] P2002 unique constraint violation:', err.message)
      return { success: false, error: GENERIC_REGISTER_ERROR }
    }
    // Supabase AuthApiError — e-mail já cadastrado no Auth
    if (
      err.message.includes('User already registered') ||
      err.message.includes('already been registered') ||
      err.message.includes('email address is already')
    ) {
      console.error('[register] Supabase duplicate email error:', err.message)
      return { success: false, error: GENERIC_REGISTER_ERROR }
    }
    // Erro inesperado — loga no servidor, retorna mensagem genérica
    console.error('[register] Unexpected error during registration:', err.message)
  } else {
    console.error('[register] Unknown error (non-Error):', err)
  }
  return { success: false, error: GENERIC_REGISTER_ERROR }
}

/**
 * Tenta deletar usuário do Supabase Auth como limpeza após falha no Prisma.
 * Falha silenciosa — o usuário pode ser limpo manualmente via painel admin.
 */
export async function cleanupSupabaseUser(
  supabaseAdminClient: { auth: { admin: { deleteUser(id: string): Promise<unknown> } } },
  userId: string
): Promise<void> {
  try {
    await supabaseAdminClient.auth.admin.deleteUser(userId)
    console.info('[register] Supabase user cleaned up after Prisma rollback:', userId)
  } catch (cleanupErr) {
    console.error('[register] Failed to cleanup Supabase user:', userId, cleanupErr)
  }
}
