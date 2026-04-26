/**
 * Route handler para o callback do Supabase Auth.
 * Lida com code exchange para verificação de e-mail e reset de senha.
 * @see module-5-auth-recovery/TASK-0/ST003
 * @see module-5-auth-recovery/TASK-1/ST003
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getLoginRedirect } from '@/lib/auth/session'
import { userRepository } from '@/repositories/user.repository'
import { auditLogRepository } from '@/repositories/audit-log.repository'
import { env } from '@/lib/env'

const APP_URL = env.NEXT_PUBLIC_APP_URL

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Supabase envia ?error=... quando o link é inválido ou expirado
  const errorParam = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const next = searchParams.get('next') ?? null

  if (errorParam) {
    // Link expirado/inválido → retorna ao fluxo correto
    if (errorCode === 'otp_expired' || errorParam === 'expired_token') {
      return NextResponse.redirect(`${APP_URL}/recuperar-senha?error=AUTH_007`)
    }
    return NextResponse.redirect(`${APP_URL}/login?error=AUTH_001`)
  }

  const code = searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(`${APP_URL}/login?error=AUTH_001`)
  }

  const supabase = await createSupabaseServerClient()

  let session
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !data.session) {
      return NextResponse.redirect(`${APP_URL}/login?error=AUTH_001`)
    }
    session = data.session
  } catch {
    return NextResponse.redirect(`${APP_URL}/login?error=AUTH_001`)
  }

  const supabaseUser = session.user
  const role = (supabaseUser.user_metadata?.role as string | undefined) ?? ''

  // Se for fluxo de reset de senha (next=/nova-senha), redireciona para a tela
  if (next === '/nova-senha' || next?.startsWith('/nova-senha')) {
    return NextResponse.redirect(`${APP_URL}/nova-senha`)
  }

  // Fluxo de verificação de e-mail (signup): atualizar emailVerified no Prisma
  if (supabaseUser.email_confirmed_at && supabaseUser.email) {
    try {
      await userRepository.verifyEmail(supabaseUser.email)
      await auditLogRepository.log('EMAIL_VERIFIED', 'User', {
        userId: supabaseUser.id,
        entityId: supabaseUser.id,
      })
    } catch {
      // Falha silenciosa — não bloqueia o login do usuário
    }
  }

  // Redireciona para dashboard por role
  const dashboardPath = getLoginRedirect(role)
  return NextResponse.redirect(`${APP_URL}${dashboardPath}`)
}
