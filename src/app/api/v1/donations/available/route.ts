/**
 * GET /api/v1/donations/available
 * Endpoint público de doações disponíveis no raio geográfico.
 * Sem autenticação obrigatória. Rate limit: 30 req/min por IP (ARCH-007).
 * Endereço completo NUNCA exposto — apenas bairro/cidade.
 * @see module-9-retirada-publica/TASK-5
 */

import { NextResponse, type NextRequest } from 'next/server'
import { donationRepository } from '@/repositories/donation.repository'
import { AvailableDonationsQueryDto } from '@/types/dto'
import { MATCHING_CONFIG } from '@/lib/constants'

// ---------------------------------------------------------------------------
// Rate limiter in-memory (fallback quando Vercel KV indisponível — ARCH-005)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number
  windowStart: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()
const WINDOW_MS = 60_000 // 1 minuto

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  const limit = MATCHING_CONFIG.RATE_LIMIT_AVAILABLE

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return { allowed: true, remaining: limit - 1, resetAt: now + WINDOW_MS }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.windowStart + WINDOW_MS }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.windowStart + WINDOW_MS }
}

function extractIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '0.0.0.0'
  )
}

// ---------------------------------------------------------------------------
// DTO de resposta — nunca expõe endereço completo
// ---------------------------------------------------------------------------

type DonationSummaryDTO = {
  id: string
  quantityAvailable: number
  distanceMeters: number
  bairro: string
  cidade: string
  windowStart: string
  windowEnd: string
  donationType: string
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const ip = extractIp(request)

  // 1. Rate limit
  const rl = checkRateLimit(ip)
  const headers = {
    'X-RateLimit-Limit': String(MATCHING_CONFIG.RATE_LIMIT_AVAILABLE),
    'X-RateLimit-Remaining': String(rl.remaining),
    'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
    'Cache-Control': 'max-age=30, stale-while-revalidate=60',
  }

  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: 'RATE_001',
        message: 'Muitas solicitações. Aguarde antes de tentar novamente.',
        retryAfter: 60,
      },
      {
        status: 429,
        headers: { ...headers, 'Retry-After': '60' },
      }
    )
  }

  // 2. Validar query params
  const { searchParams } = new URL(request.url)
  const raw = {
    lat: searchParams.get('lat'),
    lng: searchParams.get('lng'),
    radius: searchParams.get('radius') ?? undefined,
    quantity: searchParams.get('quantity') ?? undefined,
  }

  const parsed = AvailableDonationsQueryDto.safeParse({
    lat: raw.lat !== null ? Number(raw.lat) : undefined,
    lng: raw.lng !== null ? Number(raw.lng) : undefined,
    radius: raw.radius,
    quantity: raw.quantity,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VAL_002', message: 'Coordenadas inválidas.' },
      { status: 400, headers }
    )
  }

  const { lat, lng, radius, quantity } = parsed.data

  // 3. Limitar raio ao máximo (silenciosamente)
  const radiusKm = Math.min((radius ?? 5000) / 1000, MATCHING_CONFIG.MAX_RADIUS_KM)

  try {
    // 4. Buscar doações no raio
    const donations = await donationRepository.findAvailableNear({ lat, lng }, radiusKm)

    // 5. Filtrar por quantidade mínima e mapear para DTO (sem dados sensíveis)
    const minQuantity = quantity ?? 1
    const filtered = donations.filter((d) => d.remainingPortions >= minQuantity)

    // Buscar bairro/cidade dos doadores em paralelo
    const { prisma } = await import('@/lib/prisma')
    const donorIds = [...new Set(filtered.map((d) => d.donorId))]
    const addresses = await prisma.address.findMany({
      where: { userId: { in: donorIds }, isPrimary: true },
      select: { userId: true, bairro: true, cidade: true },
    })
    const addressMap = new Map(addresses.map((a) => [a.userId, a]))

    const result: DonationSummaryDTO[] = filtered.map((d) => {
      const addr = addressMap.get(d.donorId)
      return {
        id: d.id,
        quantityAvailable: d.remainingPortions,
        distanceMeters: Math.round(d.distanceKm * 1000),
        bairro: addr?.bairro ?? '',
        cidade: addr?.cidade ?? '',
        windowStart: d.windowStart.toISOString(),
        windowEnd: d.windowEnd.toISOString(),
        donationType: d.type,
        // PROIBIDO: address, lat, lng, donorName, donorId
      }
    })

    return NextResponse.json(
      { donations: result, total: result.length },
      { status: 200, headers }
    )
  } catch (err) {
    console.error('[GET /api/v1/donations/available]', err)
    return NextResponse.json(
      { error: 'SYS_001', message: 'Erro interno. Tente novamente.' },
      { status: 500, headers }
    )
  }
}
