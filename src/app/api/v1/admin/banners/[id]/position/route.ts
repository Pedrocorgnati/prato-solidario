/**
 * PATCH /api/v1/admin/banners/:id/position
 * Atualiza posição e/ou prioridade de uma campanha.
 * @see module-17-banners-system/TASK-1/ST005
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { UserRole, BannerPosition, AdminActionType } from '@/types/enums'
import { authService } from '@/services/auth.service'
import { adminService } from '@/services/admin.service'
import { bannerRepository } from '@/repositories/banner.repository'
import { errorResponse, AUTH_007, BAN_003, SYS_001 } from '@/constants/errors'

const positionSchema = z.object({
  position: z.nativeEnum(BannerPosition).optional(),
  priority: z.number().int().min(1).max(999).optional(),
}).refine((d) => d.position !== undefined || d.priority !== undefined, {
  message: 'Informe ao menos position ou priority.',
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(token)
  if (!auth || auth.role !== UserRole.ADMIN) return errorResponse(AUTH_007)

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse({ code: 'VAL_001', status: 400, message: 'Payload inválido.' })
  }

  const parsed = positionSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'VAL_002', message: 'Dados inválidos.', fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  try {
    const existing = await bannerRepository.findById(id)
    if (!existing) return errorResponse(BAN_003)

    const newPosition = parsed.data.position ?? existing.position
    const newPriority = parsed.data.priority ?? existing.priority

    const updated = await bannerRepository.updatePosition(id, newPosition, newPriority)

    await adminService.executeAdminAction({
      adminId: auth.userId,
      type: AdminActionType.APPROVE,
      targetId: id,
      targetType: 'banner',
      reason: `Posição/prioridade alterada: position=${newPosition} priority=${newPriority}`,
    })

    return Response.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /admin/banners/:id/position]', err)
    return errorResponse(SYS_001)
  }
}
