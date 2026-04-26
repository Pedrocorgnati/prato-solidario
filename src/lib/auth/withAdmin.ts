/**
 * withAdmin — wrapper de autorização para API routes admin.
 * Verifica sessão + role ADMIN antes de delegar ao handler.
 * Retorna AUTH_003 (403) se não autorizado.
 * @see module-16-admin-gestao/TASK-0/ST003
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/session'

export type AdminHandler<TParams = Record<string, string>> = (
  req: NextRequest,
  context: { params: TParams; adminId: string }
) => Promise<NextResponse>

/**
 * Protege uma API Route exigindo role ADMIN na sessão.
 *
 * @example
 * export const POST = withAdmin(async (req, { adminId }) => {
 *   // handler seguro — adminId garantido
 * })
 */
export function withAdmin<TParams = Record<string, string>>(
  handler: AdminHandler<TParams>
) {
  return async (
    req: NextRequest,
    context: { params: Promise<TParams> | TParams }
  ): Promise<NextResponse> => {
    const session = await getServerSession()

    if (!session || (session.role as string) !== 'ADMIN') {
      return NextResponse.json(
        { code: 'AUTH_003', message: 'Acesso restrito a administradores.' },
        { status: 403 }
      )
    }

    const params = await Promise.resolve(context.params)

    return handler(req, { params, adminId: session.id })
  }
}
