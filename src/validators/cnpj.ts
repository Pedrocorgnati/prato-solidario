import { z } from 'zod'

/**
 * Validação de CNPJ com algoritmo real dos dois dígitos verificadores.
 * @see module-2-shared-foundations/TASK-2/ST002
 */

/**
 * Valida CNPJ com algoritmo real.
 * Aceita formato com ou sem máscara.
 * - Rejeita CNPJs com todos os dígitos iguais
 */
export function isValidCnpj(cnpj: string): boolean {
  const stripped = cnpj.replace(/\D/g, '')
  if (stripped.length !== 14) return false
  if (/^(\d)\1+$/.test(stripped)) return false

  const calcDigit = (length: number): number => {
    let sum = 0
    let pos = length - 7
    for (let i = length; i >= 1; i--) {
      sum += parseInt(stripped[length - i]) * pos--
      if (pos < 2) pos = 9
    }
    const result = sum % 11
    return result < 2 ? 0 : 11 - result
  }

  return (
    calcDigit(12) === parseInt(stripped[12]) &&
    calcDigit(13) === parseInt(stripped[13])
  )
}

/** Schema Zod com refinamento de CNPJ. Mensagem em português. */
export const cnpjSchema = z.string().refine(isValidCnpj, { message: 'CNPJ inválido' })
