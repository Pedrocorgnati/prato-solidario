/**
 * GET /api/v1/auth/mercadopago/callback
 * Processa o callback OAuth do MercadoPago Connect.
 *
 * INT-097: MP Connect OAuth | FEAT-MM-001
 * Fluxo: valida CSRF → troca código → persiste tokens criptografados → redirect
 */
import { type NextRequest, NextResponse } from 'next/server'
import { handleCallback } from '@/services/mercadopago.service'
import { mpConnectionRepository } from '@/repositories/mp-connection.repository'
import { errorResponse, MP_002, MP_004 } from '@/constants/errors'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

const BASE_URL = env.NEXT_PUBLIC_APP_URL

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')

  // Marmitaria cancelou no fluxo do MP
  if (errorParam) {
    console.info('[MP Callback] Usuário cancelou OAuth:', { errorParam })
    return NextResponse.redirect(`${BASE_URL}/marmitaria/integracoes/mercadopago?error=cancelled`)
  }

  if (!code || !state) {
    return errorResponse({ code: 'MP_CSRF_INVALID', status: 400, message: 'Parâmetros OAuth ausentes.' })
  }

  // 1. Valida CSRF e troca código por tokens
  const result = await handleCallback(code, state)

  if ('error' in result) {
    console.warn('[MP Callback] Falha na validação:', { code: result.code, error: result.error })

    if (result.code === 'AUTH_002') {
      return NextResponse.redirect(`${BASE_URL}/marmitaria/integracoes/mercadopago?error=AUTH_002`)
    }
    if (result.code === 'SYS_003') {
      return NextResponse.redirect(`${BASE_URL}/marmitaria/integracoes/mercadopago?error=SYS_003`)
    }
    return errorResponse(MP_002)
  }

  // 2. Persiste tokens criptografados
  try {
    await mpConnectionRepository.create({
      marmitariaId: result.marmitariaId,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      expiresAt: result.tokens.expiresAt,
      mpUserId: result.tokens.mpUserId,
      publicKey: result.tokens.publicKey,
      liveMode: result.tokens.liveMode,
    })
  } catch (err) {
    // Nunca loga tokens — apenas metadata
    console.error('[MP Callback] Falha ao persistir conexão MP:', {
      marmitariaId: result.marmitariaId,
      mpUserId: result.tokens.mpUserId,
      error: String(err),
    })
    return errorResponse(MP_004)
  }

  // 3. Redirect com toast trigger
  return NextResponse.redirect(`${BASE_URL}/marmitaria/integracoes/mercadopago?connected=true`)
}
