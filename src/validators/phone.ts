import { z } from 'zod'

/**
 * Validação de número de telefone brasileiro (celular e fixo com DDD).
 * @see module-2-shared-foundations/TASK-2/ST004
 */

/**
 * Valida número de telefone brasileiro.
 * - Celular: DDD (2 dígitos) + 9 dígitos = 11 dígitos total
 * - Fixo: DDD (2 dígitos) + 8 dígitos = 10 dígitos total
 * - Aceita formato com ou sem máscara
 * - DDD é obrigatório
 */
export function isValidPhoneBr(phone: string): boolean {
  const stripped = phone.replace(/\D/g, '')
  // Celular: 11 dígitos (DDD + 9 dígitos)
  // Fixo: 10 dígitos (DDD + 8 dígitos)
  return stripped.length === 11 || stripped.length === 10
}

/** Schema Zod com refinamento de telefone BR. Mensagem em português. */
export const phoneBrSchema = z
  .string()
  .refine(isValidPhoneBr, { message: 'Telefone inválido (use DDD + número)' })
