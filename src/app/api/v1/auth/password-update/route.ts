import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { passwordUpdateSchema } from '@/schemas/auth.schema'
import { errorResponse, AUTH_006, AUTH_007, SYS_001 } from '@/constants/errors'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1]
  if (!token) return errorResponse(AUTH_007)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse({ code: 'VAL_001', status: 400, message: 'Payload inválido.' })
  }

  const parsed = passwordUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'VAL_002', message: 'Dados inválidos.', fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  try {
    await authService.updatePassword(parsed.data.password)
    return Response.json({ message: 'Senha redefinida com sucesso.' })
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'AUTH_TOKEN_EXPIRED') return errorResponse(AUTH_006)
    return errorResponse(SYS_001)
  }
}
