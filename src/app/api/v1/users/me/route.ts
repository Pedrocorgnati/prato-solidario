import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth/session'
import { userService } from '@/services/user.service'
import { updateUserSchema } from '@/schemas/user.schema'
import { errorResponse, AUTH_007, USER_007, SYS_001 } from '@/constants/errors'

export async function GET(request: NextRequest) {
  const auth = await getServerSession()
  if (!auth) return errorResponse(AUTH_007)

  try {
    const user = await userService.getUserById(auth.id)
    if (!user) return errorResponse(USER_007)
    return Response.json({ data: user })
  } catch {
    return errorResponse(SYS_001)
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await getServerSession()
  if (!auth) return errorResponse(AUTH_007)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse({ code: 'VAL_001', status: 400, message: 'Payload inválido.' })
  }

  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'VAL_002', message: 'Dados inválidos.', fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const ip = request.headers.get('x-forwarded-for') ?? undefined

  try {
    const user = await userService.updateUser(auth.id, parsed.data, ip)
    return Response.json({ data: user })
  } catch {
    return errorResponse(SYS_001)
  }
}
