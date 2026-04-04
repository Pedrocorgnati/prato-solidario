'use server'

import { UserRole } from '@/lib/constants'

// RESOLVED: redirect pós-login sem role-awareness — signIn retorna role para
// que login/page.tsx possa redirecionar para a área correta do usuário.
// TODO (Supabase): substituir stub pelo signIn real:
//   const { data, error } = await supabase.auth.signInWithPassword({ email, password })
//   const role = data.user?.user_metadata?.role as UserRole
//   cookies().set('ps_role', role, { httpOnly: true, sameSite: 'lax', path: '/' })
//   cookies().set('ps_session', data.session?.access_token ?? '', { httpOnly: true, sameSite: 'lax', path: '/' })
//   return { data: { role }, error: null }
export async function signIn(_data: { email: string; password: string; rememberMe?: boolean }) {
  // Stub: simula login bem-sucedido como DOADOR para testes de UI
  // Substituir pelo signIn real do Supabase quando integrado
  return { data: { role: UserRole.DOADOR as UserRole }, error: null }
}

export async function signUp(_data: {
  email: string
  password: string
  name: string
  role: string
}) {
  // TODO: Implementar com Supabase Auth
  return { data: null, error: null }
}

export async function signOut() {
  // TODO: Implementar com Supabase Auth
  return { error: null }
}

export async function resendVerification(_email: string) {
  // TODO: Implementar com Supabase Auth
  return { error: null }
}

export async function resetPassword(_email: string) {
  // TODO: Implementar com Supabase Auth
  return { error: null }
}
