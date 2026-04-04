import { NextRequest } from 'next/server'
import { userService } from '@/services/user.service'
import { createMarmitariaSchema } from '@/schemas/user.schema'
import { errorResponse, USER_001, USER_002, USER_003, USER_004, USER_005, SYS_001 } from '@/constants/errors'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse({ code: 'VAL_001', status: 400, message: 'Payload inválido.' })
  }

  const parsed = createMarmitariaSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'VAL_002', message: 'Dados inválidos.', fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const ip = request.headers.get('x-forwarded-for') ?? undefined

  try {
    const user = await userService.createMarmitaria(parsed.data, ip)
    return Response.json(
      {
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          marmitariaStatus: user.marmitariaStatus,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    const msg = (err as Error).message
    if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('already')) return errorResponse(USER_002)
    if (msg.includes('USER_DOCUMENT_EXISTS')) return errorResponse(USER_001)
    if (msg.includes('USER_INVALID_DOCUMENT')) return errorResponse(USER_003)
    if (msg.includes('USER_PHOTO_REQUIRED')) return errorResponse(USER_004)
    if (msg.includes('USER_PRICE_INVALID')) return errorResponse(USER_005)
    return errorResponse(SYS_001)
  }
}
