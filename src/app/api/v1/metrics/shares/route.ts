/**
 * POST /api/v1/metrics/shares
 *
 * Tracking anônimo de compartilhamentos da Corrente do Bem.
 * Persiste evento em AuditLog (action='share_event') com metadata { channel, context }.
 * Sem PII — userId opcional via sessão, nunca obrigatório.
 *
 * @see intake-review/TASK-9/ST003 — gap CL-295
 *
 * Ressalva: não foi criado model ShareEvent dedicado para evitar migration Prisma em P3.
 * Dashboard admin de métricas agregadas fica como follow-up.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth/session'

const bodySchema = z.object({
  channel: z.enum(['web-share', 'clipboard', 'whatsapp', 'twitter', 'instagram', 'other']),
  context: z.string().max(100).optional(),
})

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const { channel, context } = parsed.data
  const session = await getServerSession().catch(() => null)

  try {
    await prisma.auditLog.create({
      data: {
        userId: session?.id ?? null,
        action: 'share_event',
        entityType: 'corrente_bem',
        metadata: { channel, context: context ?? null },
      },
    })
    return NextResponse.json({ ok: true }, { status: 202 })
  } catch (err) {
    console.error('[metrics/shares]', err)
    // Best-effort — nunca quebra a experiência de share do usuário
    return NextResponse.json({ ok: false }, { status: 202 })
  }
}
