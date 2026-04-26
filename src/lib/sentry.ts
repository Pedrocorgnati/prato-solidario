import * as Sentry from '@sentry/nextjs'
import { PII_FIELDS } from '@/lib/constants/pii'

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug' | 'log'

/**
 * Remove campos PII de objetos de forma recursiva antes de enviar ao Sentry.
 */
export function sanitizeForSentry(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sanitizeForSentry)

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (PII_FIELDS.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
      result[key] = `[REDACTED_${key.toUpperCase()}]`
    } else {
      result[key] = sanitizeForSentry(value)
    }
  }
  return result
}

/**
 * Captura uma exceção no Sentry com contexto extra sanitizado.
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(sanitizeForSentry(context) as Record<string, unknown>)
    }
    Sentry.captureException(error)
  })
}

/**
 * Captura uma mensagem no Sentry.
 */
export function captureMessage(
  message: string,
  level: SeverityLevel = 'info',
): void {
  Sentry.captureMessage(message, level)
}

/**
 * Adiciona um breadcrumb ao contexto Sentry atual.
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data: data ? (sanitizeForSentry(data) as Record<string, unknown>) : undefined,
    level: 'info',
  })
}

/**
 * Wrapper para spans manuais de performance.
 */
export async function withSentrySpan<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  return Sentry.startSpan({ name }, fn)
}
