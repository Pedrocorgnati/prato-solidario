/**
 * POST /api/v1/banners/schedule
 * Cria campanha consumindo crédito do restaurante (débito atômico).
 * @see module-17-banners-system/TASK-3/ST003
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { UserRole, BannerPosition } from '@/types/enums'
import { authService } from '@/services/auth.service'
import { bannerService } from '@/services/banner.service'
import { errorResponse, AUTH_007, BAN_001, BAN_002, SYS_001 } from '@/constants/errors'

const scheduleSchema = z.object({
  title: z.string().min(3).max(255),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().refine((v) => v.startsWith('https://'), { message: 'URL deve usar HTTPS.' }),
  position: z.nativeEnum(BannerPosition),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  const auth = await authService.getSessionFromToken(token)
  if (!auth) return errorResponse(AUTH_007)

  if (auth.role !== UserRole.DOADOR_RESTAURANTE) {
    return errorResponse(BAN_002)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse({ code: 'VAL_001', status: 400, message: 'Payload inválido.' })
  }

  const parsed = scheduleSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'VAL_002', message: 'Dados inválidos.', fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { title, imageUrl, linkUrl, position, startDate, endDate } = parsed.data
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (end <= start) {
    return Response.json({ error: 'VAL_003', message: 'Data de fim deve ser posterior à data de início.' }, { status: 422 })
  }

  try {
    const campaign = await bannerService.scheduleCampaign(auth.userId, {
      title,
      imageUrl,
      linkUrl,
      position,
      startDate: start,
      endDate: end,
    })

    return Response.json({ data: campaign }, { status: 201 })
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'BAN_001') return errorResponse(BAN_001)
    console.error('[POST /banners/schedule]', err)
    return errorResponse(SYS_001)
  }
}
