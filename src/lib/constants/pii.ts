/**
 * Campos considerados PII (Personally Identifiable Information).
 * Usados por Sentry beforeSend, pino serializers e sanitizeForSentry.
 * Fonte única de verdade — importar ao invés de redefinir.
 */
export const PII_FIELDS = [
  'email',
  'cpf',
  'cnpj',
  'password',
  'token',
  'accessToken',
  'refreshToken',
] as const

export type PiiField = (typeof PII_FIELDS)[number]

/**
 * Redata campos PII de um objeto de forma recursiva.
 * Retorna uma cópia do objeto com valores PII substituídos por [REDACTED_*].
 */
export function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (PII_FIELDS.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
      result[key] = `[REDACTED_${key.toUpperCase()}]`
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = redactObject(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }
  return result
}
