import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { errorResponse, AUTH_007 } from '@/constants/errors'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const session = await authService.getSession()
  if (!session) return errorResponse(AUTH_007)

  return Response.json({ data: session })
}
