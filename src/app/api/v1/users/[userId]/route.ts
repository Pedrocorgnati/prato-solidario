import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { userService } from '@/services/user.service'
import { errorResponse, AUTH_007, AUTH_008, USER_007, SYS_001 } from '@/constants/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(token)
  if (!auth) return errorResponse(AUTH_007)
  if (auth.role !== 'ADMIN') return errorResponse(AUTH_008)

  const { userId } = await params

  try {
    const user = await userService.getUserById(userId)
    if (!user) return errorResponse(USER_007)
    return Response.json({ data: user })
  } catch {
    return errorResponse(SYS_001)
  }
}
