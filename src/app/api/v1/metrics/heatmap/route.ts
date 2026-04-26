/**
 * GET /api/v1/metrics/heatmap?period=30d
 * Dados geoespaciais agregados para o mapa de calor.
 *
 * - Público (sem autenticação)
 * - PostGIS ST_SnapToGrid: células de ~1km² (0.01°)
 * - k-anonimato k=3: células com < 3 eventos omitidas (LGPD/privacidade)
 * - Intensity normalizada 0.0–1.0
 * - Cache CDN: public, max-age=60, s-maxage=300, stale-while-revalidate=600 (5 min CDN, 1 min browser)
 * - Rate limit: 60 req/min por IP
 *
 * @see module-21-heatmap/TASK-1
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkApiRateLimit, rateLimitHeaders } from '@/lib/api-rate-limit'

const VALID_PERIODS = ['7d', '30d', '90d'] as const
type Period = (typeof VALID_PERIODS)[number]

const PERIOD_DAYS: Record<Period, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

const K_THRESHOLD = 3
const MAX_CELLS = 100

// Comentário inline p/ transparência (aparece nos docs)
// "Dados de doações e demanda dos últimos N dias — atualizado a cada 30min"

interface HeatmapRow {
  lat: number
  lng: number
  donation_count: bigint
  retrieval_count: bigint
  total: bigint
}

export async function GET(req: NextRequest) {
  // Rate limit: 60 req/min por IP
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = checkApiRateLimit(`heatmap:${clientIp}`, 60)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'RATE_001', message: 'Muitas requisições. Tente novamente em breve.' },
      {
        status: 429,
        headers: { ...rateLimitHeaders(rl), 'Retry-After': '60' },
      },
    )
  }

  // Validar parâmetro period
  const rawPeriod = req.nextUrl.searchParams.get('period') ?? '30d'
  if (!VALID_PERIODS.includes(rawPeriod as Period)) {
    return NextResponse.json(
      { error: 'VAL_001', message: 'Período inválido. Use: 7d, 30d, 90d' },
      { status: 400 },
    )
  }

  const period = rawPeriod as Period
  const days = PERIOD_DAYS[period]
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  try {
    // PostGIS: agrupa coordenadas em células de ~1km² via ST_SnapToGrid(0.01°)
    // Usa centróides por célula — nunca coordenadas individuais (privacidade LGPD)
    // FULL OUTER JOIN combina doações e retiradas no mesmo grid
    const rows = await prisma.$queryRaw<HeatmapRow[]>`
      WITH donation_cells AS (
        SELECT
          ST_Y(ST_Centroid(ST_SnapToGrid(location::geometry, 0.01)))::float AS lat,
          ST_X(ST_Centroid(ST_SnapToGrid(location::geometry, 0.01)))::float AS lng,
          COUNT(*)::bigint AS donation_count
        FROM donations
        WHERE
          location IS NOT NULL
          AND deleted_at IS NULL
          AND created_at >= ${since}
        GROUP BY ST_SnapToGrid(location::geometry, 0.01)
      ),
      retrieval_cells AS (
        SELECT
          ST_Y(ST_Centroid(ST_SnapToGrid(d.location::geometry, 0.01)))::float AS lat,
          ST_X(ST_Centroid(ST_SnapToGrid(d.location::geometry, 0.01)))::float AS lng,
          COUNT(*)::bigint AS retrieval_count
        FROM retrieval_codes rc
        JOIN donations d ON rc.donation_id = d.id
        WHERE
          d.location IS NOT NULL
          AND d.deleted_at IS NULL
          AND rc.status = 'CONFIRMED'
          AND rc.confirmed_at >= ${since}
        GROUP BY ST_SnapToGrid(d.location::geometry, 0.01)
      ),
      combined AS (
        SELECT
          COALESCE(dc.lat, rc.lat) AS lat,
          COALESCE(dc.lng, rc.lng) AS lng,
          COALESCE(dc.donation_count, 0::bigint) AS donation_count,
          COALESCE(rc.retrieval_count, 0::bigint) AS retrieval_count,
          COALESCE(dc.donation_count, 0::bigint) + COALESCE(rc.retrieval_count, 0::bigint) AS total
        FROM donation_cells dc
        FULL OUTER JOIN retrieval_cells rc ON dc.lat = rc.lat AND dc.lng = rc.lng
      )
      SELECT lat, lng, donation_count, retrieval_count, total
      FROM combined
      WHERE total >= ${K_THRESHOLD}
      ORDER BY total DESC
      LIMIT ${MAX_CELLS}
    `

    const cacheHeaders = {
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
      'X-Cache-Age': '0',
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          data: [],
          metadata: {
            period,
            updated_at: new Date().toISOString(),
            total_cells: 0,
            k_threshold: K_THRESHOLD,
          },
        },
        { headers: cacheHeaders },
      )
    }

    const maxTotal = Math.max(...rows.map((r) => Number(r.total)))

    const data = rows.map((r) => ({
      lat: r.lat,
      lng: r.lng,
      donationCount: Number(r.donation_count),
      retrievalCount: Number(r.retrieval_count),
      intensity: maxTotal > 0 ? Number(r.total) / maxTotal : 0,
    }))

    return NextResponse.json(
      {
        data,
        metadata: {
          period,
          updated_at: new Date().toISOString(),
          total_cells: data.length,
          k_threshold: K_THRESHOLD,
        },
      },
      { headers: cacheHeaders },
    )
  } catch (err) {
    console.error('[GET /api/v1/metrics/heatmap] Erro:', err)

    const isTimeout =
      err instanceof Error &&
      (err.message.includes('timeout') ||
        err.message.includes('canceling statement') ||
        err.message.includes('connection'))

    if (isTimeout) {
      return NextResponse.json(
        { error: 'SYS_003', message: 'Serviço temporariamente indisponível' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    return NextResponse.json(
      { error: 'SYS_001', message: 'Erro interno ao carregar dados do mapa' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
