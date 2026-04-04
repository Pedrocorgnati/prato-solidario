import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { UserRole, ROUTES } from '@/lib/constants'

// RESOLVED: auth guards inexistentes — proxy.ts (Next.js 16+) com guards por role

/** Rota home de cada role — usada no redirect quando role não tem permissão */
const ROLE_HOME: Record<string, string> = {
  [UserRole.ADMIN]:       ROUTES.ADMIN,
  [UserRole.DOADOR]:      ROUTES.DOADOR,
  [UserRole.ONG]:         ROUTES.DOADOR,
  [UserRole.MARMITARIA]:  ROUTES.MARMITARIA,
  [UserRole.RECEPTOR]:    ROUTES.RETIRAR,
  [UserRole.PATROCINADOR]:ROUTES.PATROCINAR,
  [UserRole.VOLUNTARIO]:  ROUTES.ENTRAR,
}

// Prefixos de rotas protegidas e os roles que podem acessá-las
const ROUTE_GUARDS: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: '/doador',               roles: [UserRole.DOADOR, UserRole.ONG] },
  { prefix: '/marmitaria',           roles: [UserRole.MARMITARIA] },
  { prefix: '/admin',                roles: [UserRole.ADMIN] },
  { prefix: '/meus-codigos',         roles: [UserRole.RECEPTOR] },
  { prefix: '/perfil',               roles: [UserRole.RECEPTOR, UserRole.DOADOR, UserRole.ONG, UserRole.MARMITARIA, UserRole.PATROCINADOR] },
  { prefix: '/patrocinar/historico', roles: [UserRole.PATROCINADOR] },
  { prefix: '/patrocinar/checkout',  roles: [UserRole.PATROCINADOR] },
]

// Prefixos públicos — sem autenticação necessária
const PUBLIC_PREFIXES = [
  ROUTES.ENTRAR,
  ROUTES.LOGIN,
  ROUTES.RECUPERAR_SENHA,
  ROUTES.VERIFICAR_EMAIL,
  ROUTES.RETIRAR,
  ROUTES.COMO_FUNCIONA,
  ROUTES.TERMOS,
  ROUTES.PRIVACIDADE,
  ROUTES.HALL_DA_FAMA,
  ROUTES.PATROCINAR,
  '/cadastro',
  '/api',
]

function requiresAuth(pathname: string): UserRole[] | null {
  for (const guard of ROUTE_GUARDS) {
    if (pathname === guard.prefix || pathname.startsWith(guard.prefix + '/')) {
      return guard.roles
    }
  }
  return null
}

function isPublic(pathname: string): boolean {
  if (pathname === ROUTES.HOME) return true
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const requiredRoles = requiresAuth(pathname)
  if (!requiredRoles) {
    return NextResponse.next()
  }

  // RESOLVED: verificação de role no proxy pendente — lê ps_role (cookie de role)
  // setado pelo signIn() Server Action após autenticação bem-sucedida.
  //
  // TODO (Supabase): substituir bloco abaixo por:
  //   const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, ...)
  //   const { data: { session } } = await supabase.auth.getSession()
  //   const role = session?.user?.user_metadata?.role as UserRole | undefined
  //   if (!session) → redirect /login com redirectTo
  //   if (!requiredRoles.includes(role!)) → redirect para área do role
  const allCookies = request.cookies.getAll()
  const hasSession = allCookies.some(
    ({ name }) =>
      name === 'sb-access-token' ||
      name === 'supabase-auth-token' ||
      name === 'ps_session' ||
      (name.startsWith('sb-') && name.endsWith('-auth-token'))
  )

  if (!hasSession) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verifica role via cookie ps_role (setado por signIn Server Action)
  const userRole = request.cookies.get('ps_role')?.value as UserRole | undefined
  if (userRole && !requiredRoles.includes(userRole)) {
    // Role sem permissão → redireciona para área inicial do role do usuário
    const fallback = ROLE_HOME[userRole] ?? ROUTES.ENTRAR
    return NextResponse.redirect(new URL(fallback, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Aplica proxy em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - /images/* (assets públicos)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|images/).*)',
  ],
}
