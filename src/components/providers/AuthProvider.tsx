'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import type { SessionUser, AuthContext } from '@/types/auth'
import type { UserRole } from '@/types/enums'
import { useRouter } from 'next/navigation'

const AuthCtx = createContext<AuthContext>({ user: null, isLoading: true })

/**
 * Provedor de autenticacao global.
 * Escuta mudancas de auth via onAuthStateChange do Supabase.
 * @see module-3-auth-login/TASK-2/ST002, TASK-6 (correcao pos-auditoria)
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()

    // Carregar sessao inicial via getUser() (nao getSession())
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email!,
          role: data.user.user_metadata?.role as UserRole,
          name: data.user.user_metadata?.name ?? data.user.email!,
          avatarUrl: data.user.user_metadata?.avatar_url,
        })
      }
      setIsLoading(false)
    })

    // Escutar mudancas de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
        router.push('/')
      } else if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          role: session.user.user_metadata?.role as UserRole,
          name: session.user.user_metadata?.name ?? session.user.email!,
          avatarUrl: session.user.user_metadata?.avatar_url,
        })
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <AuthCtx.Provider value={{ user, isLoading }}>{children}</AuthCtx.Provider>
}

export function useAuthContext() {
  return useContext(AuthCtx)
}
