/**
 * GET /api/v1/auth/mercadopago/authorize
 * Inicia o fluxo OAuth do MercadoPago Connect para marmitarias.
 *
 * INT-097: MP Connect OAuth | FEAT-MM-001
 * Segurança: apenas marmitarias autenticadas podem acessar.
 */
import { NextResponse } from 'next/server'
import { authService } from '@/services/auth.service'
import { getAuthUrl } from '@/services/mercadopago.service'
import { errorResponse, MP_001, MP_003 } from '@/constants/errors'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  // 1. Valida sessão
  const session = await authService.getSession()
  if (!session) {
    return errorResponse(MP_001)
  }

  // 2. Verifica role MARMITARIA
  if (session.user.role !== 'MARMITARIA') {
    return errorResponse(MP_003)
  }

  // 3. Obtém MarmitariaProfile para pegar o marmitariaId
  const profile = await prisma.marmitariaProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!profile) {
    return errorResponse(MP_003)
  }

  // 4. Gera URL OAuth com CSRF state e define cookie httpOnly
  try {
    const authUrl = await getAuthUrl(profile.id)
    return NextResponse.redirect(authUrl)
  } catch (err) {
    console.error('[MP Authorize] Falha ao gerar URL OAuth:', err)
    return errorResponse({ code: 'SYS_003', status: 500, message: 'Falha ao iniciar autenticação com o Mercado Pago.' })
  }
}
