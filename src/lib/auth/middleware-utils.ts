import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Roles como strings (valores reais em user_metadata.role do Supabase)
// user.service.ts armazena: DOADOR_PF, DOADOR_RESTAURANTE, MARMITARIA,
//                           ONG, RECEPTOR, PATROCINADOR, ADMIN
// ---------------------------------------------------------------------------
const ROLE = {
  DOADOR_PF: 'DOADOR_PF',
  DOADOR_RESTAURANTE: 'DOADOR_RESTAURANTE',
  MARMITARIA: 'MARMITARIA',
  ONG: 'ONG',
  RECEPTOR: 'RECEPTOR',
  PATROCINADOR: 'PATROCINADOR',
  ADMIN: 'ADMIN',
} as const

type RouteRule = {
  pattern: RegExp
  allowedRoles?: string[]  // strings de role — undefined = público
  requireAuth?: boolean     // true = qualquer autenticado
}

// ---------------------------------------------------------------------------
// Mapeamento de rotas protegidas (paths reais do frontend)
// ---------------------------------------------------------------------------
export const ROUTE_RULES: RouteRule[] = [
  // Área do doador (DOADOR_PF, DOADOR_RESTAURANTE, ONG compartilham /doador)
  {
    pattern: /^\/doador(\/.*)?$/,
    allowedRoles: [ROLE.DOADOR_PF, ROLE.DOADOR_RESTAURANTE, ROLE.ONG],
  },
  // Área da marmitaria
  {
    pattern: /^\/marmitaria(\/.*)?$/,
    allowedRoles: [ROLE.MARMITARIA],
  },
  // Admin
  {
    pattern: /^\/admin(\/.*)?$/,
    allowedRoles: [ROLE.ADMIN],
  },
  // Meus códigos (receptor e ONG)
  {
    pattern: /^\/meus-codigos(\/.*)?$/,
    allowedRoles: [ROLE.RECEPTOR, ROLE.ONG],
  },
  // Perfil legado
  {
    pattern: /^\/perfil(\/.*)?$/,
    requireAuth: true,
  },
  // Minha conta — módulo-6 (qualquer autenticado)
  {
    pattern: /^\/conta(\/.*)?$/,
    requireAuth: true,
  },
]

/** Rotas públicas que nunca devem redirecionar para login. */
export const PUBLIC_ROUTES = [
  '/conta-excluida',
]

/**
 * Retorna a regra de rota que corresponde ao pathname ou null se rota pública.
 */
export function matchRoute(pathname: string): RouteRule | null {
  return ROUTE_RULES.find(rule => rule.pattern.test(pathname)) ?? null
}

/**
 * Constrói uma URL de redirect interno para o pathname informado.
 */
export function buildRedirectUrl(request: NextRequest, to: string): URL {
  const url = request.nextUrl.clone()
  url.pathname = to
  url.search = ''
  return url
}

/**
 * Constrói a URL de redirect para /login com parâmetro redirectTo sanitizado.
 * Aceita apenas paths internos (previne open redirect attack).
 */
export function buildLoginRedirect(request: NextRequest): URL {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  const pathname = request.nextUrl.pathname
  // Sanitização: apenas paths internos sem double-slash ou protocolo
  if (pathname.startsWith('/') && !pathname.startsWith('//') && !pathname.includes('://')) {
    url.searchParams.set('redirectTo', pathname)
  }
  return url
}
