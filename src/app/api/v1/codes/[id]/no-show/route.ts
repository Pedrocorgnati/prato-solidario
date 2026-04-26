/**
 * POST /api/v1/codes/{id}/no-show
 * Registra ausência do doador. Grace period de 30min: código permanece ACTIVE.
 * Apenas ONG pode acessar este endpoint.
 * @see module-10-codigos-historico/TASK-3/ST004
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getServerSession } from '@/lib/auth/session'
import { retrievalService } from '@/services/retrieval.service'

const uuidSchema = z.string().uuid('ID deve ser um UUID válido.')

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Validar UUID
  const parsed = uuidSchema.safeParse(id)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VAL_002', message: 'ID inválido. Deve ser um UUID.' },
      { status: 400 }
    )
  }

  // Autenticação e role ONG
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'AUTH_001', message: 'Não autenticado.' }, { status: 401 })
  }
  if ((session.role as string) !== 'ONG') {
    return NextResponse.json({ error: 'AUTH_004', message: 'Acesso restrito a ONGs.' }, { status: 403 })
  }

  try {
    await retrievalService.handleNoShow(id, session.id)
    return NextResponse.json({
      success: true,
      message: 'Ausência registrada. Código ativo por mais 30 minutos.',
      graceMinutes: 30,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('SYS_080')) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Código não encontrado.' }, { status: 404 })
    }
    if (msg.includes('SYS_053')) {
      return NextResponse.json({ error: 'SYS_053', message: 'Código não está ativo.' }, { status: 422 })
    }
    console.error('[POST /api/v1/codes/:id/no-show]', err)
    return NextResponse.json({ error: 'SYS_001', message: 'Erro interno.' }, { status: 500 })
  }
}
