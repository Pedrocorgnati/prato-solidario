import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { userService } from '@/services/user.service'
import { errorResponse, AUTH_007, USER_006, SYS_001 } from '@/constants/errors'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(token)
  if (!auth) return errorResponse(AUTH_007)

  const ip = request.headers.get('x-forwarded-for') ?? undefined

  try {
    await userService.requestDeletion(auth.userId, ip)
    const deletionScheduledAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
    return Response.json({
      message: 'Solicitação de exclusão registrada. Sua conta será excluída em 15 dias.',
      deletionScheduledAt,
    })
  } catch (err) {
    const msg = (err as Error).message
    if (msg.includes('USER_HAS_ACTIVE_DONATIONS')) return errorResponse(USER_006)
    return errorResponse(SYS_001)
  }
}
