import { z } from 'zod'

/**
 * Validação de CPF com algoritmo real dos dois dígitos verificadores.
 * @see module-2-shared-foundations/TASK-2/ST001
 */

/**
 * Valida CPF com algoritmo real (dois dígitos verificadores).
 * Aceita formato com ou sem máscara.
 * - Rejeita CPFs com todos os dígitos iguais (000.000.000-00 etc.)
 * - Strip automático de máscara antes da validação
 */
export function isValidCpf(cpf: string): boolean {
  const stripped = cpf.replace(/\D/g, '')
  if (stripped.length !== 11) return false
  if (/^(\d)\1+$/.test(stripped)) return false

  // Primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(stripped[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(stripped[9])) return false

  // Segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(stripped[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(stripped[10])
}

/** Schema Zod com refinamento de CPF. Mensagem em português. */
export const cpfSchema = z.string().refine(isValidCpf, { message: 'CPF inválido' })
