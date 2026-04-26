'use server'
/**
 * Server Actions de autenticação — implementações reais via Supabase.
 * @see module-3-auth-login, module-4-auth-register, module-5-auth-recovery
 */
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getLoginRedirect } from '@/lib/auth/session'
import type { UserRole } from '@/types/enums'
import { env } from '@/lib/env'

export async function signIn(data: {
  email: string
  password: string
  rememberMe?: boolean
}): Promise<{ data: { role: UserRole } | null; error: string | null }> {
  const supabase = await createSupabaseServerClient()
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })
  if (error || !authData.user) {
    return { data: null, error: error?.message ?? 'AUTH_001' }
  }
  const role = (authData.user.user_metadata?.role as UserRole) ?? ('' as UserRole)
  return { data: { role }, error: null }
}

export async function signUp(data: {
  email: string
  password: string
  name: string
  role: string
}): Promise<{ data: null; error: string | null }> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { name: data.name, role: data.role },
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })
  return { data: null, error: error?.message ?? null }
}

export async function signOut(): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signOut({ scope: 'global' })
  return { error: error?.message ?? null }
}

export async function resendVerification(email: string): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email })
  return { error: error?.message ?? null }
}

export async function resetPassword(email: string): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=/nova-senha`,
  })
  return { error: error?.message ?? null }
}

/** Retorna o path de redirecionamento pós-login para um dado role. */
export function getRedirectPath(role: string): string {
  return getLoginRedirect(role)
}
