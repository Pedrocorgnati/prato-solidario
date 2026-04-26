import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma and session
vi.mock('@/lib/prisma', () => ({
  prisma: {
    sponsorPurchase: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth/session', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 29 }),
}))

import { GET } from '@/app/api/v1/sponsors/purchases/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth/session'

describe('GET /api/v1/sponsors/purchases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna 401 para usuário não autenticado', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/v1/sponsors/purchases') as any
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('retorna histórico paginado do patrocinador', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ id: 'user-1', email: 'a@b.com', role: 'PATROCINADOR' as any, name: 'Test' })
    vi.mocked(prisma.sponsorPurchase.findMany).mockResolvedValueOnce([
      { id: 'p1', paymentStatus: 'COMPLETED', marmitaria: { tradeName: 'Marm 1' }, sponsoredMeals: [] },
    ] as any)
    vi.mocked(prisma.sponsorPurchase.count).mockResolvedValueOnce(1)

    const req = new Request('http://localhost/api/v1/sponsors/purchases') as any
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('pagination')
    expect(body.pagination.total).toBe(1)
  })

  it('filtra por status quando fornecido', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ id: 'user-1', email: 'a@b.com', role: 'PATROCINADOR' as any, name: 'Test' })
    vi.mocked(prisma.sponsorPurchase.findMany).mockResolvedValueOnce([] as any)
    vi.mocked(prisma.sponsorPurchase.count).mockResolvedValueOnce(0)

    const req = new Request('http://localhost/api/v1/sponsors/purchases?status=COMPLETED') as any
    await GET(req)
    expect(prisma.sponsorPurchase.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ paymentStatus: 'COMPLETED' }),
      })
    )
  })
})
