/**
 * POST /api/v1/internal/codes/expire
 * Endpoint interno para o cron job expirar lotes de códigos.
 * Protegido por CRON_SECRET no header Authorization.
 * @see module-10-codigos-historico/TASK-4/ST004
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { env } from '@/lib/env'
import { retrievalService } from '@/services/retrieval.service'

const bodySchema = z.object({
  codeIds: z
    .array(z.string().uuid())
    .min(1, 'Informe ao menos 1 codeId.')
    .max(500, 'Máximo 500 codeIds por requisição.'),
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

  // 3. Processar cada código independentemente (sem transação global)
  let expired = 0
  let alreadyResolved = 0
  let notFound = 0
  const results: { codeId: string; result: string }[] = []

  for (const codeId of codeIds) {
    try {
      const result = await retrievalService.expireCodeById(codeId)
      if (result.expired) {
        expired++
        results.push({ codeId, result: 'expired' })
      } else if (result.reason === 'not_found') {
        notFound++
        results.push({ codeId, result: 'not_found' })
      } else {
        alreadyResolved++
        results.push({ codeId, result: 'already_resolved' })
      }
    } catch (err) {
      console.error(`[expire-cron] Erro ao expirar codeId=${codeId}:`, err)
      results.push({ codeId, result: 'error' })
    }
  }

  return NextResponse.json({
    expired,
    alreadyResolved,
    notFound,
    total: codeIds.length,
    results,
  })
}
