import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { pushTokenService } from '@/services/push-token.service'
import { errorResponse, AUTH_007, SYS_001 } from '@/constants/errors'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(token)
  if (!auth) return errorResponse(AUTH_007)

  try {
    const data = await pushTokenService.getByUserId(auth.userId)
    return Response.json({ data, pagination: { page: 1, limit: data.length, total: data.length, totalPages: 1 } })
  } catch {
    return errorResponse(SYS_001)
  }
}
