/**
 * POST /api/v1/admin/2fa/backup-codes — regenera backup codes (exige TOTP atual).
 * @see intake-review/TASK-2/ST003 — CL-265
 */

import { type NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { adminTwoFactorService } from '@/services/admin-2fa.service'
import { errorResponse } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN'])
    const body = (await request.json().catch(() => ({}))) as { totp?: string }
    if (!body.totp) {
      return NextResponse.json(errorResponse('TOTP obrigatorio', 'VAL_001'), { status: 422 })
    }
    const codes = await adminTwoFactorService.regenerateBackupCodes(user.id, body.totp)
    return NextResponse.json({ backupCodes: codes })
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }
    if (error?.code === 'TFA_INVALID' || error?.code === 'TFA_NOT_ENROLLED') {
      return NextResponse.json(errorResponse(error.message ?? 'Invalido', error.code), { status: 400 })
    }
    console.error('[POST /api/v1/admin/2fa/backup-codes]', err)
    return NextResponse.json(errorResponse('Erro interno', 'SYS_001'), { status: 500 })
  }
}
