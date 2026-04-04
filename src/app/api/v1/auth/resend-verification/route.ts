import { NextRequest } from 'next/server'
import { authService } from '@/services/auth.service'
import { resendVerificationSchema } from '@/schemas/auth.schema'

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'VAL_001', message: 'Payload inválido.' }, { status: 400 })
  }

  const parsed = resendVerificationSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'VAL_002', message: 'E-mail inválido.', fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  await authService.resendVerification(parsed.data.email).catch(() => {})
  return Response.json({ message: 'E-mail de verificação reenviado.' })
}
