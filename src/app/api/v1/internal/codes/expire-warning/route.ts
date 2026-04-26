/**
 * POST /api/v1/internal/codes/expire-warning
 * Endpoint interno para o cron job enviar avisos de expiração em lote.
 * Protegido por CRON_SECRET no header Authorization.
 * @see module-10-codigos-historico/TASK-4/ST005
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { env } from '@/lib/env'
import { notificationService } from '@/services/notification.service'

const bodySchema = z.object({
  codeIds: z
    .array(z.string().uuid())
    .min(1, 'Informe ao menos 1 codeId.')
    .max(200, 'Máximo 200 codeIds por requisição.'),
})

export async function POST(request: NextRequest) {
  // 1. Autenticar via CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token || token !== env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'AUTH_001', message: 'Não autorizado.' },
      { status: 401 }
    )
  }

  // 2. Validar body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'VAL_001', message: 'Body inválido.' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VAL_001', message: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 }
    )
  }

  const { codeIds } = parsed.data

  // 3. Processar cada código — erros de push não abortam o batch
  let sent = 0
  let skipped = 0
  let errors = 0

  for (const codeId of codeIds) {
    try {
      await notificationService.sendExpirationWarning(codeId)
      sent++
    } catch (err) {
      // sendExpirationWarning já captura erros internamente, mas por segurança:
      console.error(`[expire-warning-cron] Erro codeId=${codeId}:`, err)
      errors++
    }
  }

  return NextResponse.json({ sent, skipped, errors, total: codeIds.length })
}
