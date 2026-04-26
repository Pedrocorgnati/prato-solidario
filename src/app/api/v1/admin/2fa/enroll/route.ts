/**
 * GET  /api/v1/admin/2fa/enroll — inicia enrollment (secret + otpauth URL)
 * POST /api/v1/admin/2fa/enroll — confirma com primeiro TOTP, retorna backup codes
 * @see intake-review/TASK-2/ST003 — CL-265
 */

import { type NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { adminTwoFactorService } from '@/services/admin-2fa.service'
import { markTwoFactorVerified } from '@/lib/auth/two-factor'
import { errorResponse } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireRole(['ADMIN'])
    const { otpauth } = await adminTwoFactorService.generateSecret(user.id, user.email)
    return NextResponse.json({ otpauth })
  } catch (err) {
    console.error('[GET /api/v1/admin/2fa/enroll]', err)
    return NextResponse.json(errorResponse('Erro interno', 'SYS_001'), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN'])
    const body = (await request.json().catch(() => ({}))) as { totp?: string }
    if (!body.totp || !/^\d{6}$/.test(body.totp)) {
      return NextResponse.json(errorResponse('TOTP com 6 digitos obrigatorio', 'VAL_001'), { status: 422 })
    }
    const { backupCodes } = await adminTwoFactorService.confirmEnrollment(user.id, body.totp)
    await markTwoFactorVerified(user.id)
    return NextResponse.json({ backupCodes })
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }
    if (error?.code === 'TFA_INVALID' || error?.code === 'TFA_NOT_STARTED') {
      return NextResponse.json(errorResponse(error.message ?? 'Invalido', error.code), { status: 400 })
    }
    console.error('[POST /api/v1/admin/2fa/enroll]', err)
    return NextResponse.json(errorResponse('Erro interno', 'SYS_001'), { status: 500 })
  }
}
