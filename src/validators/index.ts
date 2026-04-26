/**
 * Barrel export de todos os validators brasileiros.
 * @see module-2-shared-foundations/TASK-2/ST005
 */

export { isValidCpf, cpfSchema } from './cpf'
export { isValidCnpj, cnpjSchema } from './cnpj'
export { isValidCep, lookupCep, cepSchema } from './cep'
export { isValidPhoneBr, phoneBrSchema } from './phone'

// ---------------------------------------------------------------------------
// documentSchema: aceita CPF ou CNPJ via union
// ---------------------------------------------------------------------------
import { z } from 'zod'
import { isValidCpf } from './cpf'
import { isValidCnpj } from './cnpj'

/**
 * Valida campo de documento que pode ser CPF (11 dígitos) ou CNPJ (14 dígitos).
 */
export const documentSchema = z.string().refine(
  (value) => {
    const stripped = value.replace(/\D/g, '')
    if (stripped.length === 11) return isValidCpf(value)
    if (stripped.length === 14) return isValidCnpj(value)
    return false
  },
  { message: 'CPF ou CNPJ inválido' }
)
