import type { UserRole } from '@/types/enums'

/**
 * Representa o usuário autenticado na sessão.
 * Usado em Server Components (getServerSession) e Client Components (AuthProvider/useAuth).
 */
export interface SessionUser {
  id: string
  email: string
  role: UserRole
  name: string
  avatarUrl?: string
}

/**
 * Contexto de autenticação disponibilizado pelo AuthProvider.
 */
export interface AuthContext {
  user: SessionUser | null
  isLoading: boolean
}

/**
 * Mapa de redirecionamento pós-login por role.
 */
export type LoginRedirectMap = Record<UserRole, string>
