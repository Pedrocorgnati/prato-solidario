import { z } from 'zod'
import type { AddressBR } from '@/types/common'

/**
 * Validação de CEP e lookup via ViaCEP.
 * @see module-2-shared-foundations/TASK-2/ST003
 */

/** Retorno raw da API ViaCEP */
interface ViaCepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

/**
 * Valida formato de CEP (8 dígitos numéricos, com ou sem hífen).
 */
export function isValidCep(cep: string): boolean {
  const stripped = cep.replace(/\D/g, '')
  return stripped.length === 8
}

/**
 * Busca endereço via ViaCEP com timeout de 5s e 1 retry.
 * Retorna null silenciosamente em caso de erro (US-012 DEGRADED).
 */
export async function lookupCep(cep: string): Promise<AddressBR | null> {
  const stripped = cep.replace(/\D/g, '')
  if (!isValidCep(stripped)) return null

  const fetchWithTimeout = async (): Promise<AddressBR | null> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${stripped}/json/`,
        { signal: controller.signal }
      )
      clearTimeout(timeoutId)

      if (!response.ok) return null

      const data: ViaCepResponse = await response.json()

      if (data.erro) return null

      return {
        cep: data.cep.replace(/\D/g, ''),
        logradouro: data.logradouro,
        complemento: data.complemento || undefined,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
      }
    } catch {
      clearTimeout(timeoutId)
      return null
    }
  }

  // Primeira tentativa
  const first = await fetchWithTimeout()
  if (first !== null) return first

  // Retry 1x
  return fetchWithTimeout()
}

/** Schema Zod com refinamento de CEP. Mensagem em português. */
export const cepSchema = z
  .string()
  .refine(isValidCep, { message: 'CEP inválido (formato: 00000-000)' })
