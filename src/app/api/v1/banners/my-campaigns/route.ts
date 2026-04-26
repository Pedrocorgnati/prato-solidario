/**
 * GET /api/v1/banners/my-campaigns
 * Lista campanhas do restaurante autenticado.
 * @see module-17-banners-system/TASK-3/ST005
 */

import { NextRequest } from 'next/server'
import { UserRole } from '@/types/enums'
import { authService } from '@/services/auth.service'
import { bannerRepository } from '@/repositories/banner.repository'
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
    const [campaigns, balance] = await Promise.all([
      bannerRepository.findByAdvertiser(auth.userId),
      bannerService.getBalance(auth.userId),
    ])

    return Response.json({
      data: campaigns,
      balance: { daysAvailable: balance.daysAvailable },
    })
  } catch (err) {
    console.error('[GET /banners/my-campaigns]', err)
    return errorResponse(SYS_001)
  }
}
