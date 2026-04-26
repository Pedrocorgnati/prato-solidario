/**
 * GET /api/v1/banners/my-credit
 * Retorna saldo e histórico de crédito de banner do restaurante autenticado.
 * Acesso restrito a DOADOR_RESTAURANTE.
 * @see module-17-banners-system/TASK-2/ST004
 */

import { NextRequest } from 'next/server'
import { UserRole } from '@/types/enums'
import { authService } from '@/services/auth.service'
import { bannerService } from '@/services/banner.service'
import { errorResponse, AUTH_007, BAN_002, SYS_001 } from '@/constants/errors'

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(token)
  if (!auth) return errorResponse(AUTH_007)

  if (auth.role !== UserRole.DOADOR_RESTAURANTE) {
    return errorResponse(BAN_002)
  }

  try {
    const balance = await bannerService.getBalance(auth.userId)
    return Response.json({ data: balance })
  } catch (err) {
    console.error('[GET /banners/my-credit]', err)
    return errorResponse(SYS_001)
  }
}
