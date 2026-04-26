/**
 * POST /api/v1/admin/users/[id]/reset-2fa — admin reseta 2FA de outro admin.
 * @see intake-review/TASK-2/ST006 — CL-265 + CL-267
 */

import { type NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { adminTwoFactorService } from '@/services/admin-2fa.service'
import { errorResponse } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole(['ADMIN'])
    const { id } = await ctx.params
    const body = (await request.json().catch(() => ({}))) as { justification?: string }
    if (actor.id === id) {
      return NextResponse.json(errorResponse('Nao pode resetar proprio 2FA', 'VAL_001'), { status: 400 })
    }
    await adminTwoFactorService.resetFor(id, actor.id, body.justification ?? '')
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }
    if (error?.code === 'VAL_001') {
      return NextResponse.json(errorResponse(error.message ?? 'Validacao', 'VAL_001'), { status: 422 })
    }
    console.error('[POST /api/v1/admin/users/[id]/reset-2fa]', err)
    return NextResponse.json(errorResponse('Erro interno', 'SYS_001'), { status: 500 })
  }
}
