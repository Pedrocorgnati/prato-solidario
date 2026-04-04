import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const passwordResetRequestSchema = z.object({
  email: z.string().email('E-mail inválido'),
})
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>

export const passwordUpdateSchema = z.object({
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
})
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>

export const resendVerificationSchema = z.object({
  email: z.string().email('E-mail inválido'),
})
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>
