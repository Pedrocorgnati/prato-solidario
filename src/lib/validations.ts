import { z } from 'zod'

// Re-exports dos validadores canônicos (para compatibilidade com consumidores existentes)
export { isValidCpf as validateCPF } from '@/validators/cpf'
export { cpfSchema } from '@/validators/cpf'
export { isValidCnpj as validateCNPJ } from '@/validators/cnpj'
export { cnpjSchema } from '@/validators/cnpj'
export { isValidCep, cepSchema } from '@/validators/cep'
export { isValidPhoneBr, phoneBrSchema as phoneSchema } from '@/validators/phone'

// Re-exports dos formatadores canônicos (para compatibilidade com consumidores existentes)
export {
  formatCpf as formatCPF,
  formatCnpj as formatCNPJ,
  formatCep as formatCEP,
  formatPhone,
} from '@/utils/formatters'

// Schemas exclusivos deste módulo (não duplicados em @/validators)
export const emailSchema = z.string().email('E-mail inválido')
export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Deve conter ao menos uma letra maiúscula')
  .regex(/[0-9]/, 'Deve conter ao menos um número')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha obrigatória'),
  rememberMe: z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
