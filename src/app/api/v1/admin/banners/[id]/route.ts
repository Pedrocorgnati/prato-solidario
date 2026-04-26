/**
 * PATCH /api/v1/admin/banners/:id — Atualiza campos editáveis de uma campanha
 * DELETE /api/v1/admin/banners/:id — Soft delete (reason obrigatório, min 10 chars)
 * @see module-17-banners-system/TASK-1/ST004
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { UserRole, BannerStatus, BannerPosition, AdminActionType } from '@/types/enums'
import { authService } from '@/services/auth.service'
import { adminService } from '@/services/admin.service'
import { bannerRepository } from '@/repositories/banner.repository'
import { bannerService } from '@/services/banner.service'
import { errorResponse, AUTH_007, AUTH_008, BAN_003, SYS_001 } from '@/constants/errors'

const updateSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().refine((v) => v.startsWith('https://'), { message: 'URL deve usar HTTPS.' }).optional(),
  position: z.nativeEnum(BannerPosition).optional(),
  priority: z.number().int().min(1).max(999).optional(),
  permutaPartnerUrl: z.string().url().optional(),
  internalNote: z.string().max(1000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
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
      { error: 'VAL_002', message: 'Dados inválidos.', fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  try {
    const existing = await bannerRepository.findById(id)
    if (!existing) return errorResponse(BAN_003)

    const updated = await bannerRepository.updateCampaign(id, {
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    })

    await adminService.executeAdminAction({
      adminId: auth.userId,
      type: AdminActionType.APPROVE,
      targetId: id,
      targetType: 'banner',
      reason: `Campanha atualizada: ${updated.title}`,
    })

    return Response.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /admin/banners/:id]', err)
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

    // Se campanha ACTIVE: pausar primeiro
    if (existing.status === BannerStatus.ACTIVE) {
      await bannerService.pauseCampaign(id)
    }

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
    console.error('[DELETE /admin/banners/:id]', err)
    return errorResponse(SYS_001)
  }
}
