/**
 * POST /api/v1/admin/2fa/verify — valida TOTP ou backup code; marca sessao como verificada.
 * @see intake-review/TASK-2/ST003 — CL-265
 */

import { type NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { adminTwoFactorService } from '@/services/admin-2fa.service'
import { markTwoFactorVerified } from '@/lib/auth/two-factor'
import { errorResponse } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN'])
    const body = (await request.json().catch(() => ({}))) as { token?: string }
    if (!body.token) {
      return NextResponse.json(errorResponse('Token obrigatorio', 'VAL_001'), { status: 422 })
    }
    await adminTwoFactorService.verify(user.id, body.token)
    await markTwoFactorVerified(user.id)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }
    if (error?.code === 'TFA_INVALID' || error?.code === 'TFA_REUSED' || error?.code === 'TFA_NOT_ENROLLED') {
      return NextResponse.json(errorResponse(error.message ?? 'Invalido', error.code), { status: 401 })
    }
    if (error?.code === 'RATE_LIMITED') {
      return NextResponse.json(errorResponse('Muitas tentativas. Aguarde 15min.', 'RATE_LIMITED'), { status: 429 })
    }
    console.error('[POST /api/v1/admin/2fa/verify]', err)
    return NextResponse.json(errorResponse('Erro interno', 'SYS_001'), { status: 500 })
  }
}
