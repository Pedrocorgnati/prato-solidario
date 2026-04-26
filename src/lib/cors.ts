/**
 * CORS — whitelist de origens por ambiente.
 * Fonte: env `ALLOWED_ORIGINS` (csv). Suporta wildcard de subdominio: `*.vercel.app`.
 *
 * @see intake-review/TASK-1/ST001 (CL-333)
 */

const DEFAULT_LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]

export function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS
  if (!raw) {
    // Dev: libera localhost padrao; prod deve setar ALLOWED_ORIGINS explicitamente
    return process.env.NODE_ENV === 'production' ? [] : DEFAULT_LOCAL_ORIGINS
  }
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0)
}

/**
 * Extrai a parte curinga de um pattern:
 *   "*.vercel.app" -> ".vercel.app"
 *   "https://*.vercel.app" -> ".vercel.app"
 * Retorna null se o pattern nao for wildcard.
 */
function extractWildcardSuffix(pattern: string): string | null {
  const idx = pattern.indexOf('*.')
  if (idx === -1) return null
  // ".vercel.app" — comeca no ponto
  return pattern.slice(idx + 1)
}

/**
 * Verifica se uma origin esta na whitelist.
 * Suporta match exato e wildcard de subdominio (`*.exemplo.com` ou
 * `https://*.exemplo.com` -> `https://foo.exemplo.com`).
 */
export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false
  const allowed = getAllowedOrigins()
  for (const pattern of allowed) {
    if (pattern === origin) return true

    const suffix = extractWildcardSuffix(pattern)
    if (suffix) {
      try {
        const url = new URL(origin)
        const baseHost = suffix.slice(1) // "vercel.app"
        if (url.host.endsWith(suffix) && url.host !== baseHost) {
          return true
        }
      } catch {
        // origin malformada
      }
    }
  }
  return false
}

export interface CorsHeaders {
  'Access-Control-Allow-Origin': string
  'Access-Control-Allow-Methods': string
  'Access-Control-Allow-Headers': string
  'Access-Control-Allow-Credentials': string
  'Access-Control-Max-Age': string
  Vary: string
}

export function buildCorsHeaders(origin: string): CorsHeaders {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Request-Id',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

/**
 * Aplica CORS headers a uma Response existente. Retorna a mesma response com headers setados.
 */
export function withCors<T extends { headers: Headers }>(response: T, origin: string): T {
  const headers = buildCorsHeaders(origin)
  for (const [k, v] of Object.entries(headers)) {
    response.headers.set(k, v)
  }
  return response
}
