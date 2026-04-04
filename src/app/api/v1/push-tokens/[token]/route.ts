import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { pushTokenService } from '@/services/push-token.service'
import { pushTokenRepository } from '@/repositories/push-token.repository'
import { errorResponse, AUTH_007, PUSH_001, SYS_001 } from '@/constants/errors'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const authHeader = request.headers.get('authorization')?.split(' ')[1]
  if (!authHeader) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(authHeader)
  if (!auth) return errorResponse(AUTH_007)

  const { token } = await params
  const existing = await pushTokenRepository.findByToken(token)
  if (!existing) return errorResponse(PUSH_001)

  try {
    await pushTokenService.remove(token)
    return new Response(null, { status: 204 })
  } catch {
    return errorResponse(SYS_001)
  }
}
