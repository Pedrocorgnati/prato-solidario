/**
 * PATCH /api/v1/admin/banners/permuta/:id — Atualiza/pausa/ativa acordo
 * DELETE /api/v1/admin/banners/permuta/:id — Remove acordo (reason obrigatório)
 * @see module-17-banners-system/TASK-5/ST003
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { UserRole, BannerStatus, AdminActionType } from '@/types/enums'
import { authService } from '@/services/auth.service'
import { adminService } from '@/services/admin.service'
import { bannerRepository } from '@/repositories/banner.repository'
import { errorResponse, AUTH_007, BAN_003, SYS_001 } from '@/constants/errors'

const updateSchema = z.object({
  status: z.nativeEnum(BannerStatus).optional(),
  internalNote: z.string().max(1000).optional(),
})

const deleteSchema = z.object({
  reason: z.string().min(10, { message: 'Motivo é obrigatório (mínimo 10 caracteres).' }),
})

async function requireAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return null
  const auth = await authService.getSessionFromToken(token)
  if (!auth || auth.role !== UserRole.ADMIN) return null
  return auth
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth) return errorResponse(AUTH_007)

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse({ code: 'VAL_001', status: 400, message: 'Payload inválido.' })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'VAL_002', message: 'Dados inválidos.' },
      { status: 422 }
    )
  }

  try {
    const existing = await bannerRepository.findById(id)
    if (!existing) return errorResponse(BAN_003)

    const updated = parsed.data.status
      ? await bannerRepository.updateStatus(id, parsed.data.status)
      : existing

    await adminService.executeAdminAction({
      adminId: auth.userId,
      type: AdminActionType.APPROVE,
      targetId: id,
      targetType: 'banner',
      reason: `Acordo de permuta atualizado.`,
    })

    return Response.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /admin/banners/permuta/:id]', err)
    return errorResponse(SYS_001)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (!auth) return errorResponse(AUTH_007)

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse({ code: 'VAL_001', status: 400, message: 'Payload inválido.' })
  }

  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'VAL_001', message: parsed.error.issues[0]?.message ?? 'Motivo é obrigatório.' },
      { status: 400 }
    )
  }

  try {
    const existing = await bannerRepository.findById(id)
    if (!existing) return errorResponse(BAN_003)

    await bannerRepository.softDelete(id)

    await adminService.executeAdminAction({
      adminId: auth.userId,
      type: AdminActionType.DELETE,
      targetId: id,
      targetType: 'banner',
      reason: parsed.data.reason,
    })

    return new Response(null, { status: 204 })
  } catch (err) {
    console.error('[DELETE /admin/banners/permuta/:id]', err)
    return errorResponse(SYS_001)
  }
}
