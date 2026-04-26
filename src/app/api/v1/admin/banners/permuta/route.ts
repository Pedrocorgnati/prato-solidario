/**
 * GET /api/v1/admin/banners/permuta — Lista acordos de permuta
 * POST /api/v1/admin/banners/permuta — Cria acordo de permuta (priority=900, custo zero)
 * @see module-17-banners-system/TASK-5/ST003
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { UserRole, BannerType, BannerPosition, AdminActionType } from '@/types/enums'
import { authService } from '@/services/auth.service'
import { adminService } from '@/services/admin.service'
import { bannerRepository } from '@/repositories/banner.repository'
import { errorResponse, AUTH_007, SYS_001 } from '@/constants/errors'

const permutaSchema = z.object({
  title: z.string().min(3).max(255),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().refine((v) => v.startsWith('https://'), { message: 'URL deve usar HTTPS.' }),
  position: z.nativeEnum(BannerPosition),
  permutaPartnerUrl: z.string().url().refine((v) => v.startsWith('https://'), { message: 'URL do parceiro deve usar HTTPS.' }),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  internalNote: z.string().max(1000).optional(),
})

async function requireAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return null
  const auth = await authService.getSessionFromToken(token)
  if (!auth || auth.role !== UserRole.ADMIN) return null
  return auth
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return errorResponse(AUTH_007)

  try {
    const result = await bannerRepository.findManyAdmin({ type: BannerType.PERMUTA })
    return Response.json({ data: result.data, total: result.total })
  } catch (err) {
    console.error('[GET /admin/banners/permuta]', err)
    return errorResponse(SYS_001)
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth) return errorResponse(AUTH_007)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse({ code: 'VAL_001', status: 400, message: 'Payload inválido.' })
  }

  const parsed = permutaSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'VAL_002', message: 'Dados inválidos.', fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  try {
    // PERMUTA tem priority=900 (menor prioridade que PAID=100)
    const campaign = await bannerRepository.createCampaign({
      ...parsed.data,
      type: BannerType.PERMUTA,
      advertiserId: auth.userId,
      priority: 900,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    })

    await adminService.executeAdminAction({
      adminId: auth.userId,
      type: AdminActionType.APPROVE,
      targetId: campaign.id,
      targetType: 'banner',
      reason: `Acordo de permuta criado: ${campaign.title}`,
    })

    return Response.json({ data: campaign }, { status: 201 })
  } catch (err) {
    console.error('[POST /admin/banners/permuta]', err)
    return errorResponse(SYS_001)
  }
}
