import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { errorResponse, AUTH_007, SYS_001 } from '@/constants/errors'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  try {
    const session = await authService.getSessionFromToken(token)
    await authService.signOut(session?.userId)
    return new Response(null, { status: 204 })
  } catch {
    return errorResponse(SYS_001)
  }
}
