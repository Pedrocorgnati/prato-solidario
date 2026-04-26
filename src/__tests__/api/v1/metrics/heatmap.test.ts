/**
 * Testes — GET /api/v1/metrics/heatmap
 * @see module-21-heatmap/TASK-1/ST006
 *
 * Cenários:
 *   (a) 200 com estrutura correta { data: [], metadata: {} }
 *   (b) k-anonimato — célula com < 3 eventos omitida
 *   (c) intensity normalizada — max = 1.0
 *   (d) período inválido → 400 + VAL_001
 *   (e) sem dados → 200 com array vazio
 *   (f) rate limiting → 429 + RATE_001
 *   (g) DB timeout → 503 + SYS_003
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}))

// Mock rate limiter — allowed by default
vi.mock('@/lib/api-rate-limit', () => ({
  checkApiRateLimit: vi.fn(() => ({ allowed: true, remaining: 59, limit: 60 })),
  rateLimitHeaders: vi.fn(() => ({ 'X-RateLimit-Remaining': '0', 'X-RateLimit-Limit': '60' })),
}))

import { prisma } from '@/lib/prisma'
import { checkApiRateLimit } from '@/lib/api-rate-limit'
import { GET } from '@/app/api/v1/metrics/heatmap/route'

const mockPrisma = prisma as { $queryRaw: ReturnType<typeof vi.fn> }
const mockRateLimit = checkApiRateLimit as ReturnType<typeof vi.fn>

function makeRequest(period?: string): NextRequest {
  const url = period
    ? `http://localhost:3000/api/v1/metrics/heatmap?period=${period}`
    : 'http://localhost:3000/api/v1/metrics/heatmap'
  return new NextRequest(url)
}

const MOCK_ROWS = [
  { lat: -23.55, lng: -46.63, donation_count: BigInt(10), retrieval_count: BigInt(5), total: BigInt(15) },
  { lat: -22.91, lng: -43.17, donation_count: BigInt(6), retrieval_count: BigInt(4), total: BigInt(10) },
  { lat: -15.78, lng: -47.93, donation_count: BigInt(3), retrieval_count: BigInt(2), total: BigInt(5) },
]

describe('GET /api/v1/metrics/heatmap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimit.mockReturnValue({ allowed: true, remaining: 59, limit: 60 })
  })

  it('deve retornar 200 com estrutura correta { data, metadata }', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce(MOCK_ROWS)

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('metadata')
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.metadata).toHaveProperty('period', '30d')
    expect(body.metadata).toHaveProperty('updated_at')
    expect(body.metadata).toHaveProperty('total_cells')
    expect(body.metadata).toHaveProperty('k_threshold', 3)
  })

  it('deve retornar células com donationCount, retrievalCount e intensity', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce(MOCK_ROWS)

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.data.length).toBe(3)
    for (const cell of body.data) {
      expect(cell).toHaveProperty('lat')
      expect(cell).toHaveProperty('lng')
      expect(cell).toHaveProperty('donationCount')
      expect(cell).toHaveProperty('retrievalCount')
      expect(cell).toHaveProperty('intensity')
      expect(cell.intensity).toBeGreaterThanOrEqual(0)
      expect(cell.intensity).toBeLessThanOrEqual(1)
    }
  })

  it('deve normalizar intensity — célula com mais eventos tem intensity 1.0', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce(MOCK_ROWS)

    const res = await GET(makeRequest())
    const body = await res.json()

    // A primeira célula (total=15) deve ter intensity 1.0
    const maxCell = body.data.find((c: { lat: number }) => c.lat === -23.55)
    expect(maxCell.intensity).toBe(1)

    // Outras devem ser < 1.0
    const otherCell = body.data.find((c: { lat: number }) => c.lat === -22.91)
    expect(otherCell.intensity).toBeCloseTo(10 / 15, 5)
  })

  it('deve omitir células com < 3 eventos (k-anonimato via SQL)', async () => {
    // O k-anonimato é aplicado na query SQL (WHERE total >= 3)
    // Simula o DB retornando apenas células válidas
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      { lat: -23.55, lng: -46.63, donation_count: BigInt(4), retrieval_count: BigInt(1), total: BigInt(5) },
    ])

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.data.length).toBe(1)
    expect(body.metadata.k_threshold).toBe(3)
  })

  it('deve retornar 400 para período inválido', async () => {
    const res = await GET(makeRequest('1d'))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('VAL_001')
    expect(body.message).toContain('Período inválido')
  })

  it('deve retornar 200 com array vazio quando sem dados', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([])

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual([])
    expect(body.metadata.total_cells).toBe(0)
  })

  it('deve retornar 429 quando rate limit excedido', async () => {
    mockRateLimit.mockReturnValue({ allowed: false, remaining: 0, limit: 60 })

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(429)
    expect(body.error).toBe('RATE_001')
    expect(res.headers.get('Retry-After')).toBe('60')
  })

  it('deve retornar 503 quando DB timeout', async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('canceling statement due to statement timeout'))

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.error).toBe('SYS_003')
  })

  it('deve retornar 500 para erro genérico de DB', async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('unknown error'))

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('SYS_001')
  })

  it('deve incluir Cache-Control com s-maxage=1800', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce(MOCK_ROWS)

    const res = await GET(makeRequest())

    expect(res.headers.get('Cache-Control')).toContain('s-maxage=1800')
  })

  it('deve aceitar período 7d e 90d', async () => {
    mockPrisma.$queryRaw.mockResolvedValue(MOCK_ROWS)

    const res7d = await GET(makeRequest('7d'))
    expect(res7d.status).toBe(200)
    const body7d = await res7d.json()
    expect(body7d.metadata.period).toBe('7d')

    const res90d = await GET(makeRequest('90d'))
    expect(res90d.status).toBe(200)
    const body90d = await res90d.json()
    expect(body90d.metadata.period).toBe('90d')
  })
})
