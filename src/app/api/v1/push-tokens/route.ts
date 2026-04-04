import { NextRequest } from 'next/server'
import { pushTokenService } from '@/services/push-token.service'
import { registerPushTokenSchema } from '@/schemas/push-token.schema'
import { errorResponse, PUSH_002, SYS_001 } from '@/constants/errors'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse({ code: 'VAL_001', status: 400, message: 'Payload inválido.' })
  }

  const parsed = registerPushTokenSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'VAL_002', message: 'Dados inválidos.', fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  try {
    const token = await pushTokenService.register(parsed.data)
    return Response.json({ data: token }, { status: 201 })
  } catch (err) {
    const msg = (err as Error).message
    if (msg.includes('PUSH_INVALID')) return errorResponse(PUSH_002)
    return errorResponse(SYS_001)
  }
}
