'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getLoginRedirect } from '@/lib/auth/session'
import {
  checkLoginAllowed,
  recordFailedLogin,
  recordSuccessfulLogin,
} from '@/services/auth.service'
import type { UserRole } from '@/types/enums'

// ---------------------------------------------------------------------------
// ST003 — loginSchema (campos em português)
// ---------------------------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().email('E-mail inválido').max(255),
  senha: z.string().min(8, 'Mínimo 8 caracteres').max(128),
  lembrarMe: z.boolean().optional(), // RESOLVED: sem .default() — input=output=boolean|undefined, elimina mismatch zodResolver v5
  redirectTo: z.string().optional(),
})
export type LoginInput = z.infer<typeof loginSchema>

// ---------------------------------------------------------------------------
// TASK-4/ST005 — CSRF protection
// Next.js Server Actions já validam Content-Type e Origin nativamente.
// Esta camada adicional é explícita para auditoria e documentação.
// ---------------------------------------------------------------------------
async function validateCsrf(): Promise<void> {
  const headersList = await headers()
  const origin = headersList.get('origin')
  const host = headersList.get('host')
  if (origin && host && !origin.includes(host)) {
    throw new Error('CSRF: origin não permitido')
  }
}

// ---------------------------------------------------------------------------
// ST004 + TASK-4/ST003 — loginAction com account lock integrado
// ---------------------------------------------------------------------------
export async function loginAction(formData: LoginInput): Promise<{ error?: string }> {
  // 1. CSRF protection (primeira linha — bloqueia cross-origin)
  await validateCsrf()

  // 2. Validação Zod
  const parsed = loginSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  // 3. Verificar bloqueio de conta (AUTH_002)
  const lockCheck = await checkLoginAllowed(parsed.data.email)
  if (!lockCheck.allowed) return { error: lockCheck.error }

  // 4. Autenticar via Supabase
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.senha,
  })

  if (error) {
    // 5a. Registrar tentativa falha → pode ativar bloqueio
    const failResult = await recordFailedLogin(parsed.data.email)
    if (failResult.lockedNow) {
      return {
        error: 'Conta temporariamente bloqueada após múltiplas tentativas. Tente em 30 minutos.',
      }
    }

    if (error.message.includes('Email not confirmed')) {
      return { error: 'Verifique seu e-mail antes de continuar' }
    }

    // AUTH_001: nunca revelar se é e-mail ou senha
    return { error: 'E-mail ou senha incorretos' }
  }

  // 5b. Sucesso: resetar contador de falhas
  await recordSuccessfulLogin(parsed.data.email)

  // 6. Redirecionar — se redirectTo valido (path interno), usar; senao, por role
  const role = data.user.user_metadata?.role as UserRole
  const redirectTo = parsed.data.redirectTo
  // Sanitizacao US-024: apenas paths internos, sem double-slash ou protocolo
  const safeRedirect =
    redirectTo &&
    redirectTo.startsWith('/') &&
    !redirectTo.startsWith('//') &&
    !redirectTo.includes('://')
      ? redirectTo
      : getLoginRedirect(role)
  redirect(safeRedirect)
}

// ---------------------------------------------------------------------------
// ST005 — logoutAction
// ---------------------------------------------------------------------------
export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  // scope: 'global' invalida token no servidor Supabase (todos os dispositivos)
  await supabase.auth.signOut({ scope: 'global' })
  // Cache-Control: no-store para dispositivos compartilhados
  redirect('/')
}
