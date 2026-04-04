import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { passwordResetRequestSchema } from '@/schemas/auth.schema'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'VAL_001', message: 'Payload inválido.' }, { status: 400 })
  }

  const parsed = passwordResetRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'VAL_002', message: 'E-mail inválido.', fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  // Resposta uniforme independente de o e-mail existir (proteção contra enumeração)
  await authService.resetPassword(parsed.data.email).catch(() => {})
  return Response.json({ message: 'Se este e-mail estiver cadastrado, você receberá um link.' })
}
