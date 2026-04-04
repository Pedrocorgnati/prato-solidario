import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { loginSchema } from '@/schemas/auth.schema'
import { errorResponse, AUTH_001, AUTH_002, AUTH_003, SYS_001 } from '@/constants/errors'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse({ code: 'VAL_001', status: 400, message: 'Payload inválido.' })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'VAL_002', message: 'Dados inválidos.', fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined

  try {
    const result = await authService.signIn(parsed.data.email, parsed.data.password, ip)
    return Response.json({ data: result }, { status: 200 })
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'AUTH_INVALID_CREDENTIALS') return errorResponse(AUTH_001)
    if (code === 'AUTH_EMAIL_NOT_VERIFIED') return errorResponse(AUTH_002)
    if (code === 'AUTH_RATE_LIMITED') return errorResponse(AUTH_003)
    return errorResponse(SYS_001)
  }
}
