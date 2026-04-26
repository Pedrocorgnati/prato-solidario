'use client'

import { useAuthContext } from '@/components/providers/AuthProvider'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

/**
 * Hook publico de autenticacao para Client Components.
 * Retorna user, isLoading e signOut.
 * @see module-3-auth-login/TASK-2/ST003, TASK-6 (correcao pos-auditoria)
 */
export function useAuth() {
  const { user, isLoading } = useAuthContext()

  async function signOut(): Promise<void> {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut({ scope: 'global' })
    // AuthProvider.onAuthStateChange captura SIGNED_OUT e redireciona
  }

  return { user, isLoading, signOut }
}
