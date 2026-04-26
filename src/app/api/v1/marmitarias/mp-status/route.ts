/**
 * GET /api/v1/marmitarias/mp-status
 * Retorna o estado da conexão Mercado Pago da marmitaria autenticada.
 * @see intake-review TASK-6/ST001 (CL-279)
 *
 * Sem chamadas externas — verificação puramente local via expiresAt/status.
 */

import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { errorResponse } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireRole(['MARMITARIA'])

    const profile = await prisma.marmitariaProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })

    if (!profile) {
      return NextResponse.json(
        errorResponse('Perfil de marmitaria não encontrado', 'AUTH_008'),
        { status: 404 }
      )
    }

    const mp = await prisma.mPConnection.findUnique({
      where: { marmitariaId: profile.id },
      select: {
        mpUserId: true,
        expiresAt: true,
        status: true,
        accessTokenEncrypted: true,
      },
    })

    if (!mp || !mp.accessTokenEncrypted) {
      return NextResponse.json({
        connected: false,
        expired: false,
        accountName: null,
        expiresAt: null,
      })
    }

    const now = new Date()
    const expired =
      (mp.expiresAt ? mp.expiresAt.getTime() < now.getTime() : false) ||
      mp.status === 'NEEDS_RECONNECT' ||
      mp.status === 'DISCONNECTED'

    return NextResponse.json({
      connected: !expired,
      expired,
      accountName: mp.mpUserId ?? null,
      expiresAt: mp.expiresAt ? mp.expiresAt.toISOString() : null,
    })
  } catch (err) {
    console.error('[GET /api/v1/marmitarias/mp-status] Erro interno:', err)
    return NextResponse.json(
      errorResponse('Erro interno ao obter status MP', 'SYS_001'),
      { status: 500 }
    )
  }
}
