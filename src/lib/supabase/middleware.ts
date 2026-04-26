import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'

/**
 * Atualiza os cookies de sessão do Supabase em cada requisição.
 * Evita logout inesperado por token expirado.
 *
 * Uso em src/middleware.ts:
 * ```
 * import { updateSession } from '@/lib/supabase/middleware'
 * export async function middleware(request: NextRequest) {
 *   return await updateSession(request)
 * }
 * ```
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh de sessão — IMPORTANTE: não remover este await.
  // Garante que tokens expirados sejam renovados antes de checar a sessão.
  await supabase.auth.getUser()

  return supabaseResponse
}
