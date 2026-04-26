/**
 * PATCH /api/v1/banners/:id/pause
 * Pausa campanha própria do restaurante (ACTIVE→PAUSED).
 * Apenas o dono da campanha pode pausar (advertiser_id === session.user.id).
 * @see module-17-banners-system/TASK-3/ST005
 */

import { NextRequest } from 'next/server'
import { UserRole } from '@/types/enums'
import { authService } from '@/services/auth.service'
import { bannerRepository } from '@/repositories/banner.repository'
import { errorResponse, AUTH_007, BAN_002, BAN_003, BAN_004, SYS_001 } from '@/constants/errors'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(token)
  if (!auth) return errorResponse(AUTH_007)

  if (auth.role !== UserRole.DOADOR_RESTAURANTE) {
    return errorResponse(BAN_002)
  }

  const { id } = await params

  try {
    const campaign = await bannerRepository.pauseOwnCampaign(id, auth.userId)
    return Response.json({ data: campaign })
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'BAN_003') return errorResponse(BAN_003)
    if (code === 'BAN_004') return errorResponse(BAN_004)
    console.error('[PATCH /banners/:id/pause]', err)
    return errorResponse(SYS_001)
  }
}
