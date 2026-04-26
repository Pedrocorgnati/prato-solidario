/**
 * GET /api/v1/gamification/diplomas?year={y}
 *
 * Retorna URL assinada de diploma anual do usuário autenticado.
 * Gera o diploma on-demand se não existir.
 * Rate limit: 10 req/min por userId.
 * IDOR check: userId da sessão == userId do diploma.
 *
 * @see module-20-gamificacao/TASK-4/ST002
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/session'
import { diplomaService, DiplomaNotFoundError, DiplomaStorageError } from '@/services/diploma.service'
import { checkApiRateLimit, rateLimitHeaders } from '@/lib/api-rate-limit'

export async function GET(req: NextRequest) {
  // Autenticação
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json(
      { error: { code: 'AUTH_001', message: 'Autenticação necessária.' } },
      { status: 401 },
    )
  }

  // Rate limit: 10 req/min por userId
  const rl = checkApiRateLimit(`diplomas:${session.id}`, 10)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_001', message: 'Muitas requisições. Tente novamente em breve.' } },
      { status: 429, headers: { ...rateLimitHeaders(rl), 'Retry-After': '60' } },
    )
  }

  const { searchParams } = req.nextUrl
  const year = parseInt(searchParams.get('year') ?? '', 10)
  const now = new Date()

  // Validação
  if (isNaN(year) || year < 2020 || year > now.getFullYear()) {
    return NextResponse.json(
      { error: { code: 'VAL_002', message: `Parâmetro year inválido. Use entre 2020 e ${now.getFullYear()}.` } },
      { status: 400 },
    )
  }

  try {
    // Verificar se já existe — renova URL se necessário
    let signedUrl = await diplomaService.getDiplomaUrl(session.id, year)

    // Gerar on-demand se não existir
    let kgFoodSaved: number | undefined
    let kgCO2Avoided: number | undefined
    let totalMeals: number | undefined

    if (!signedUrl) {
      const result = await diplomaService.generateDiploma(session.id, year)
      signedUrl = result.url
      kgFoodSaved = result.kgFoodSaved
      kgCO2Avoided = result.kgCO2Avoided
      totalMeals = result.totalMeals
    }

    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    return NextResponse.json({
      url: signedUrl,
      expiresAt,
      ...(kgFoodSaved !== undefined && { kgFoodSaved, kgCO2Avoided, totalMeals }),
    })
  } catch (err) {
    if (err instanceof DiplomaNotFoundError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: 422 },
      )
    }
    if (err instanceof DiplomaStorageError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: 503 },
      )
    }
    console.error('[GET /gamification/diplomas] Erro:', err)
    return NextResponse.json(
      { error: { code: 'SYS_001', message: 'Erro interno ao processar diploma.' } },
      { status: 500 },
    )
  }
}
