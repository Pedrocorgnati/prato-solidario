import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { userService } from '@/services/user.service'
import { errorResponse, AUTH_007, SYS_001 } from '@/constants/errors'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(token)
  if (!auth) return errorResponse(AUTH_007)

  try {
    const exportData = await userService.exportUserData(auth.userId)
    return Response.json({ data: exportData })
  } catch {
    return errorResponse(SYS_001)
  }
}
