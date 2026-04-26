import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { userRepository } from '@/repositories/user.repository'
import { errorResponse, AUTH_007, AUTH_008, SYS_001 } from '@/constants/errors'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(token)
  if (!auth) return errorResponse(AUTH_007)
  if (auth.role !== 'ADMIN') return errorResponse(AUTH_008)

  const { searchParams } = request.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const role = searchParams.get('role') ?? undefined
  const isActiveParam = searchParams.get('isActive')
  const isActive = isActiveParam !== null ? isActiveParam === 'true' : undefined
  const marmitariaStatus = searchParams.get('marmitariaStatus') as 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | undefined ?? undefined

  try {
    const { data, total } = await userRepository.findAll({ page, limit, role, isActive, marmitariaStatus })
    return Response.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch {
    return errorResponse(SYS_001)
  }
}
