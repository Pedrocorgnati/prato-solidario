/**
 * PATCH /api/v1/admin/banners/:id/pause
 * Pausa campanha (ACTIVE → PAUSED).
 * Para FREE_RESTAURANT: dias não consumidos durante pausa são preservados.
 * @see module-17-banners-system/TASK-1/ST005
 */

import { NextRequest } from 'next/server'
import { UserRole, AdminActionType } from '@/types/enums'
import { authService } from '@/services/auth.service'
import { adminService } from '@/services/admin.service'
import { bannerService } from '@/services/banner.service'
import { errorResponse, AUTH_007, BAN_003, BAN_004, SYS_001 } from '@/constants/errors'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(token)
  if (!auth || auth.role !== UserRole.ADMIN) return errorResponse(AUTH_007)

  const { id } = await params

  try {
    const campaign = await bannerService.pauseCampaign(id)

    await adminService.executeAdminAction({
      adminId: auth.userId,
      type: AdminActionType.SUSPEND,
      targetId: id,
      targetType: 'banner',
      reason: `Campanha pausada pelo admin.`,
    })

    return Response.json({ data: campaign })
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'BAN_003') return errorResponse(BAN_003)
    if (code === 'BAN_004') return errorResponse(BAN_004)
    console.error('[PATCH /admin/banners/:id/pause]', err)
    return errorResponse(SYS_001)
  }
}
