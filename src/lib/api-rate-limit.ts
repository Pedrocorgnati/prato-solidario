/**
 * Rate limiter in-memory para API routes públicas.
 * Usa sliding window com Map (reset automático via TTL).
 *
 * Limites configuráveis por endpoint. Para produção com múltiplas
 * instâncias, migrar para Upstash ou Redis.
 *
 * @see module-20-gamificacao/TASK-2 (badges: 60 req/min por IP)
 * @see module-20-gamificacao/TASK-4 (diplomas: 10 req/min por userId)
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Limpa entradas expiradas a cada 5 min para evitar memory leak
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

export interface ApiRateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

/**
 * Verifica rate limit para uma chave (IP, userId, etc.).
 *
 * @param key     - Identificador único (ex: IP, userId)
 * @param limit   - Máximo de requisições na janela
 * @param windowMs - Janela de tempo em milissegundos (padrão: 60000 = 1 min)
 */
export function checkApiRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): ApiRateLimitResult {
  cleanup()

  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: new Date(now + windowMs) }
  }

  entry.count++
  const remaining = Math.max(0, limit - entry.count)
  const allowed = entry.count <= limit

  return { allowed, remaining, resetAt: new Date(entry.resetAt) }
}

/**
 * Headers padrão de rate limit para incluir na response.
 */
export function rateLimitHeaders(result: ApiRateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.remaining + (result.allowed ? 1 : 0)),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt.getTime() / 1000)),
  }
}
