import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server'
import { auditLogRepository } from '@/repositories/audit-log.repository'

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
      const emailHash = Buffer.from(email).toString('base64').slice(0, 8)
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
    await supabase.auth.signOut()
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
    const { data } = await supabase.auth.getSession()
    if (!data.session) return null

    const role = data.session.user.user_metadata?.role as string ?? 'RECEPTOR'
    return {
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at ?? 0,
      },
      user: {
        id: data.session.user.id,
        email: data.session.user.email!,
        role,
        emailVerified: !!data.session.user.email_confirmed_at,
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
