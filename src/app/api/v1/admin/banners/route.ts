/**
 * GET /api/v1/admin/banners — Lista campanhas paginadas com filtros
 * POST /api/v1/admin/banners — Cria campanha com status DRAFT
 * Acesso restrito a ADMIN.
 * @see module-17-banners-system/TASK-1/ST004
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { UserRole, BannerType, BannerPosition } from '@/types/enums'
import { authService } from '@/services/auth.service'
import { adminService } from '@/services/admin.service'
import { bannerRepository } from '@/repositories/banner.repository'
import { validateBannerImage } from '@/lib/mime-validator'
import { errorResponse, AUTH_007, AUTH_008, SYS_001 } from '@/constants/errors'
import { AdminActionType } from '@/types/enums'

const createSchema = z.object({
  title: z.string().min(3).max(255),
  type: z.nativeEnum(BannerType),
  advertiserId: z.string().uuid().optional(),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().refine((v) => v.startsWith('https://'), { message: 'URL deve usar HTTPS.' }),
  position: z.nativeEnum(BannerPosition),
  priority: z.number().int().min(1).max(999).default(100),
  permutaPartnerUrl: z.string().url().optional(),
  internalNote: z.string().max(1000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
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
  if (!auth) return errorResponse(auth === null ? AUTH_007 : AUTH_008)

  const sp = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(sp.get('page') ?? '1'))
  const limit = Math.min(50, parseInt(sp.get('limit') ?? '10'))
  const status = sp.get('status') as Parameters<typeof bannerRepository.findManyAdmin>[0]['status'] | undefined
  const type = sp.get('type') as BannerType | undefined
  const position = sp.get('position') as BannerPosition | undefined

  try {
    const result = await bannerRepository.findManyAdmin({ status, type, position, page, limit })
    return Response.json({ data: result.data, total: result.total, page, limit })
  } catch (err) {
    console.error('[GET /admin/banners]', err)
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

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'VAL_002', message: 'Dados inválidos.', fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  try {
    const campaign = await bannerRepository.createCampaign({
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    })

    await adminService.executeAdminAction({
      adminId: auth.userId,
      type: AdminActionType.APPROVE,
      targetId: campaign.id,
      targetType: 'banner',
      reason: `Campanha criada: ${campaign.title}`,
    })

    return Response.json({ data: campaign }, { status: 201 })
  } catch (err) {
    console.error('[POST /admin/banners]', err)
    return errorResponse(SYS_001)
  }
}
