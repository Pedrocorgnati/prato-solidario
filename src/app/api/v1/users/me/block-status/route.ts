/**
 * GET /api/v1/users/me/block-status — TASK-7 (intake-review) CL-286.
 * Retorna o bloqueio anti-abuso ativo do usuario autenticado, se houver.
 */
import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { prisma } from '@/lib/prisma'
import { errorResponse, AUTH_007, SYS_001 } from '@/constants/errors'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(token)
  if (!auth) return errorResponse(AUTH_007)

  try {
    const now = new Date()
    const record = await prisma.abuseRecord.findFirst({
      where: {
        userId: auth.userId,
        blockedUntil: { gt: now },
      },
      orderBy: { blockedUntil: 'desc' },
    })

    if (!record || !record.blockedUntil) {
      return Response.json({
        data: { blocked: false },
      })
    }

    return Response.json({
      data: {
        blocked: true,
        reason: record.reason ?? 'other',
        until: record.blockedUntil.toISOString(),
        escalationStep: record.blockCount,
      },
    })
  } catch {
    return errorResponse(SYS_001)
  }
}
