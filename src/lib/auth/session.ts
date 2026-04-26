import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { SessionUser } from '@/types/auth'
import type { UserRole } from '@/types/enums'

// ---------------------------------------------------------------------------
// TASK-1/ST006 — getLoginRedirect
// Mapa de rotas pós-login por role.
// Nota: user_metadata.role armazena strings Portuguese (DOADOR_PF, ONG, etc.)
// O fallback '/entrar' cobre roles desconhecidos/corrompidos.
// ---------------------------------------------------------------------------
const REDIRECT_MAP: Record<string, string> = {
  DOADOR_PF: '/doador',
  DOADOR_RESTAURANTE: '/doador',
  RECEPTOR: '/retirar',
  ONG: '/doador',
  MARMITARIA: '/marmitaria',
  PATROCINADOR: '/patrocinar',
  ADMIN: '/admin',
  // Também cobrir Prisma-generated values caso o schema seja sincronizado
  DONOR_INDIVIDUAL: '/doador',
  DONOR_RESTAURANT: '/doador',
  ONG_AGENT: '/doador',
  MARMITARIA_PARTNER: '/marmitaria',
  SPONSOR: '/patrocinar',
}

/**
 * Retorna a rota de destino pós-login para o role informado.
 * Role desconhecido/corrompido → /entrar (fallback seguro).
 */
export function getLoginRedirect(role: string): string {
  return REDIRECT_MAP[role] ?? '/entrar'
}

// ---------------------------------------------------------------------------
// TASK-2/ST001 — Helpers de sessão server-side
// ---------------------------------------------------------------------------

/**
 * Retorna o usuário autenticado ou null.
 * Usa getUser() (não getSession()) — valida JWT no servidor Supabase.
 */
export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) return null

    return {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role as UserRole,
      name: user.user_metadata?.name ?? user.email!,
      avatarUrl: user.user_metadata?.avatar_url,
    }
  } catch {
    return null
  }
}

/**
 * Exige sessão ativa. Redireciona para /login se não autenticado.
 */
export async function requireSession(): Promise<SessionUser> {
  const user = await getServerSession()
  if (!user) redirect('/login')
  return user
}

/**
 * Exige sessão com role específico. Redireciona para /403 se role insuficiente.
 * Aceita strings de role (DOADOR_PF, ONG, etc.) ou UserRole enum.
 */
export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const user = await requireSession()
  const role = user.role as string
  if (!allowedRoles.includes(role)) redirect('/403')
  return user
}
