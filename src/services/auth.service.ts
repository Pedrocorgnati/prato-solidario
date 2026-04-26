import crypto from 'crypto'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { auditLogRepository } from '@/repositories/audit-log.repository'
import {
  isAccountLocked,
  incrementFailedAttempts,
  resetFailedAttempts,
} from '@/repositories/user.repository'

export interface AuthResult {
  session: {
    accessToken: string
    refreshToken: string
    expiresAt: number
  }
  user: {
    id: string
    email: string
    role: string
    emailVerified: boolean
  }
}

export class AuthService {
  async signIn(email: string, password: string, ipAddress?: string): Promise<AuthResult> {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16)
      await auditLogRepository.log('LOGIN_FAILED', 'User', {
        metadata: { emailHash },
        ipAddress,
      })
      if (error.message.includes('Invalid login credentials')) {
        throw Object.assign(new Error('AUTH_INVALID_CREDENTIALS'), { code: 'AUTH_INVALID_CREDENTIALS' })
      }
      if (error.message.includes('Email not confirmed')) {
        throw Object.assign(new Error('AUTH_EMAIL_NOT_VERIFIED'), { code: 'AUTH_EMAIL_NOT_VERIFIED' })
      }
      if (error.message.includes('rate')) {
        throw Object.assign(new Error('AUTH_RATE_LIMITED'), { code: 'AUTH_RATE_LIMITED' })
      }
      throw Object.assign(new Error('AUTH_INVALID_CREDENTIALS'), { code: 'AUTH_INVALID_CREDENTIALS' })
    }

    const role = data.user.user_metadata?.role as string ?? 'RECEPTOR'
    await auditLogRepository.log('LOGIN_SUCCESS', 'User', {
      userId: data.user.id,
      entityId: data.user.id,
      ipAddress,
    })

    return {
      session: {
        accessToken: data.session!.access_token,
        refreshToken: data.session!.refresh_token,
        expiresAt: data.session!.expires_at ?? 0,
      },
      user: {
        id: data.user.id,
        email: data.user.email!,
        role,
        emailVerified: !!data.user.email_confirmed_at,
      },
    }
  }

  async signOut(userId?: string): Promise<void> {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut({ scope: 'global' })
    if (userId) {
      await auditLogRepository.log('LOGOUT', 'User', { userId, entityId: userId })
    }
  }

  async resetPassword(email: string): Promise<void> {
    const supabase = await createSupabaseServerClient()
    // Resposta uniforme independente de o e-mail existir (proteção contra enumeração)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/redefinir-senha`,
    })
  }

  async updatePassword(newPassword: string): Promise<void> {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      throw Object.assign(new Error('AUTH_TOKEN_EXPIRED'), { code: 'AUTH_TOKEN_EXPIRED' })
    }
  }

  async resendVerification(email: string): Promise<void> {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.resend({ type: 'signup', email })
  }

  async getSession(): Promise<AuthResult | null> {
    const supabase = await createSupabaseServerClient()
    // Usar getUser() (não getSession()) — valida JWT no servidor Supabase
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    // Precisamos do session para tokens — mas user já foi validado
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData.session

    const role = user.user_metadata?.role as string ?? 'RECEPTOR'
    return {
      session: {
        accessToken: session?.access_token ?? '',
        refreshToken: session?.refresh_token ?? '',
        expiresAt: session?.expires_at ?? 0,
      },
      user: {
        id: user.id,
        email: user.email!,
        role,
        emailVerified: !!user.email_confirmed_at,
      },
    }
  }

  async getSessionFromToken(token: string): Promise<{ userId: string; role: string } | null> {
    const supabase = await createSupabaseAdminClient()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) return null
    const role = data.user.user_metadata?.role as string ?? 'RECEPTOR'
    return { userId: data.user.id, role }
  }
}

export const authService = new AuthService()

// ---------------------------------------------------------------------------
// TASK-4/ST002 — Account lock standalone functions
// Usadas diretamente em Server Actions (login/actions.ts)
// ---------------------------------------------------------------------------

function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

/**
 * Verifica se o login é permitido (conta não bloqueada).
 */
export async function checkLoginAllowed(email: string): Promise<{
  allowed: boolean
  error?: string
  retryAfterMs?: number
}> {
  const emailHash = hashEmail(email)
  const { locked, lockedUntil } = await isAccountLocked(emailHash)

  if (!locked) return { allowed: true }

  const retryAfterMs = lockedUntil ? lockedUntil.getTime() - Date.now() : 0
  const retryMinutes = Math.ceil(retryAfterMs / 60000)
  return {
    allowed: false,
    error: `Conta temporariamente bloqueada. Tente novamente em ${retryMinutes} minuto${retryMinutes !== 1 ? 's' : ''}.`,
    retryAfterMs,
  }
}

/**
 * Registra login falho e retorna se a conta foi bloqueada agora.
 */
export async function recordFailedLogin(
  email: string,
  ipAddress?: string
): Promise<{ lockedNow: boolean; lockedUntil: Date | null }> {
  const emailHash = hashEmail(email)
  const result = await incrementFailedAttempts(emailHash, ipAddress)
  return {
    lockedNow: result.lockedUntil !== null,
    lockedUntil: result.lockedUntil,
  }
}

/**
 * Registra login bem-sucedido (reseta contador de falhas).
 */
export async function recordSuccessfulLogin(email: string): Promise<void> {
  const emailHash = hashEmail(email)
  await resetFailedAttempts(emailHash)
}
