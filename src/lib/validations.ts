import { z } from 'zod'

export function validateCPF(cpf: string): boolean {
  const stripped = cpf.replace(/\D/g, '')
  if (stripped.length !== 11) return false
  if (/^(\d)\1+$/.test(stripped)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(stripped[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(stripped[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(stripped[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(stripped[10])
}

export function validateCNPJ(cnpj: string): boolean {
  const stripped = cnpj.replace(/\D/g, '')
  if (stripped.length !== 14) return false
  if (/^(\d)\1+$/.test(stripped)) return false

  const calc = (x: number) => {
    const ns = stripped.slice(0, x)
    const factor = x - 7
    let sum = 0
    let pos = x - (factor < 2 ? 9 : factor)
    for (let i = x; i >= 1; i--) {
      sum += parseInt(ns[x - i]) * pos--
      if (pos < 2) pos = 9
    }
    const result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    return result
  }

  return (
    calc(12) === parseInt(stripped[12]) &&
    calc(13) === parseInt(stripped[13])
  )
}

export function formatPhone(value: string): string {
  const stripped = value.replace(/\D/g, '')
  if (stripped.length <= 10) {
    return stripped.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  }
  return stripped.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

export function formatCEP(value: string): string {
  const stripped = value.replace(/\D/g, '')
  return stripped.replace(/(\d{5})(\d{0,3})/, '$1-$2')
}

export function formatCPF(value: string): string {
  const stripped = value.replace(/\D/g, '')
  return stripped.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4')
}

export function formatCNPJ(value: string): string {
  const stripped = value.replace(/\D/g, '')
  return stripped.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5')
}

// Zod schemas reutilizáveis
export const cpfSchema = z.string().refine(validateCPF, { message: 'CPF inválido' })
export const cnpjSchema = z.string().refine(validateCNPJ, { message: 'CNPJ inválido' })
export const phoneSchema = z.string().min(14, 'Telefone inválido')
export const cepSchema = z.string().length(9, 'CEP inválido (formato: 00000-000)')
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
