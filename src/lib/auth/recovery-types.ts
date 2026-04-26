/**
 * Tipos e schemas Zod compartilhados para os fluxos de recuperação de conta.
 * @see module-5-auth-recovery/TASK-0/ST002
 */
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Interfaces de dados
// ---------------------------------------------------------------------------

export interface RecoverPasswordFormData {
  email: string
}

export interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

export interface VerifyEmailState {
  email: string
  cooldownUntil?: number
}

/** Resposta padrão de Server Actions de auth recovery */
export interface ActionResult {
  success: boolean
  error?: string
  retryAfter?: number
  fields?: string[]
}

// ---------------------------------------------------------------------------
// Schemas de validação
// ---------------------------------------------------------------------------

/** Schema para solicitação de recuperação de senha (apenas e-mail) */
export const recoverPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

/** Schema para redefinição de senha — min 8 chars, 1 maiúscula, 1 número, senhas iguais */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo de 8 caracteres')
      .regex(/[A-Z]/, 'Inclua ao menos 1 letra maiúscula')
      .regex(/[0-9]/, 'Inclua ao menos 1 número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

// ---------------------------------------------------------------------------
// Janelas de rate limit
// ---------------------------------------------------------------------------

/** Cooldown de reenvio de verificação: 60 segundos */
export const RESEND_VERIFICATION_COOLDOWN_S = 60

/** Janela de rate limit para solicitação de reset de senha: 15 minutos */
export const PASSWORD_RESET_COOLDOWN_MIN = 15
