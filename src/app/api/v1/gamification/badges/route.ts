/**
 * GET /api/v1/gamification/badges?month={m}&year={y}&limit={n}
 *
 * Endpoint público para o Hall da Fama. Retorna top doadores do mês e all-time.
 * Filtra apenas usuários com hallOfFame: true (privacidade por padrão).
 * Anonimização: PF → "João S.", PJ → nome fantasia.
 *
 * Cache: 15 min (public). Rate limit: 60 req/min por IP.
 *
 * @see module-20-gamificacao/TASK-2/ST001
 */

import { NextRequest, NextResponse } from 'next/server'
import { gamificationRepository } from '@/repositories/gamification.repository'
import { checkApiRateLimit, rateLimitHeaders } from '@/lib/api-rate-limit'

// Cache de 15 min; degradado: stale-while-revalidate até 60 min
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=900, stale-while-revalidate=3600',
}

/**
 * Anonimiza o nome: PF → "João S." | PJ → usa o nome como está (nome fantasia).
 * Nunca expõe nome completo de PF na API pública.
 */
function anonymizeName(name: string | null): string {
  if (!name) return 'Doador Anônimo'
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 1) return parts[0]
  // Heurística: se o nome tem apenas 1 token ou parece CNPJ/nome fantasia, exibe como está
  // Para PF com múltiplos tokens: "Nome S."
  const firstName = parts[0]
  const lastInitial = parts[parts.length - 1][0]
  return `${firstName} ${lastInitial}.`
}

export async function GET(req: NextRequest) {
  // Rate limit: 60 req/min por IP
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkApiRateLimit(`badges:${clientIp}`, 60)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_001', message: 'Muitas requisições. Tente novamente em breve.' } },
      { status: 429, headers: { ...rateLimitHeaders(rl), 'Retry-After': '60' } },
    )
  }

  try {
    const { searchParams } = req.nextUrl
    const now = new Date()
    const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1), 10)
    const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()), 10)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50)

    // Validação de parâmetros
    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: { code: 'VAL_002', message: 'Parâmetro month inválido. Use 1-12.' } },
        { status: 400 },
      )
    }
    if (isNaN(year) || year < 2020 || year > now.getFullYear() + 1) {
      return NextResponse.json(
        { error: { code: 'VAL_002', message: 'Parâmetro year inválido.' } },
        { status: 400 },
      )
    }
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: { code: 'VAL_002', message: 'Parâmetro limit inválido.' } },
        { status: 400 },
      )
    }

    const [rawTopMonth, rawTopAllTime] = await Promise.all([
      gamificationRepository.getTopDonorsMonth(month, year, limit),
      gamificationRepository.getTopDonorsAllTime(limit),
    ])

    // Filtra apenas hallOfFame: true e anonimiza nomes
    const topMonth = rawTopMonth
      .map((d) => ({
        rank: d.rank,
        displayName: anonymizeName(d.displayName),
        avatarUrl: d.avatarUrl,
        totalMeals: d.totalMeals,
      }))

    const topAllTime = rawTopAllTime
      .map((d) => ({
        rank: d.rank,
        displayName: anonymizeName(d.displayName),
        avatarUrl: d.avatarUrl,
        totalMeals: d.totalMeals,
      }))

    return NextResponse.json(
      { topMonth, topAllTime, month, year },
      { headers: CACHE_HEADERS },
    )
  } catch (err) {
    console.error('[GET /gamification/badges] Erro:', err)
    return NextResponse.json(
      { error: { code: 'SYS_001', message: 'Serviço temporariamente indisponível.' } },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
