/**
 * Idempotência em memória com TTL 5min.
 * @see intake-review TASK-8/ST003 (CL-272)
 *
 * Ressalva: usa Map in-memory por instância. Em produção multi-instância
 * (Vercel/serverless) deve-se migrar para Redis/Upstash ou tabela dedicada
 * (IdempotencyKey) com índice por (key, createdAt).
 */

const TTL_MS = 5 * 60 * 1000

interface Entry<T> {
  value: T
  expiresAt: number
  inFlight?: Promise<T>
}

// Module-scope — persiste por processo, não por request
const store = new Map<string, Entry<unknown>>()

function gc(now: number): void {
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(key)
  }
}

/**
 * Executa `fn` garantindo que a mesma `key` retorne o mesmo resultado
 * dentro da janela TTL. Chamadas concorrentes com a mesma key compartilham
 * a mesma Promise.
 */
export async function withIdempotency<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  gc(now)

  const existing = store.get(key) as Entry<T> | undefined
  if (existing && existing.expiresAt > now) {
    if (existing.inFlight) return existing.inFlight
    return existing.value
  }

  const promise = fn()
  const placeholder: Entry<T> = {
    value: undefined as unknown as T,
    expiresAt: now + TTL_MS,
    inFlight: promise,
  }
  store.set(key, placeholder as Entry<unknown>)

  try {
    const value = await promise
    store.set(key, { value, expiresAt: now + TTL_MS })
    return value
  } catch (err) {
    // Em erro, remover a chave para permitir retry com nova tentativa
    store.delete(key)
    throw err
  }
}

/**
 * Valida formato mínimo de Idempotency-Key (RFC-like: string não vazia, <=255).
 */
export function isValidIdempotencyKey(key: string | null | undefined): key is string {
  if (!key) return false
  if (key.length < 8 || key.length > 255) return false
  return /^[A-Za-z0-9._:~-]+$/.test(key)
}

/**
 * APENAS para uso em testes — limpa o store interno.
 */
export function __resetIdempotencyStore(): void {
  store.clear()
}
