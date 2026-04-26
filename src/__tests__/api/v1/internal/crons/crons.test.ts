/**
 * Testes unitários dos 8 cron routes do module-23-crons-jobs.
 *
 * Estratégia: mock de todos os services/repositories/prisma,
 * validar apenas a lógica do handler (auth, idempotência, error handling, response).
 *
 * @see module-23-crons-jobs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// --- Mocks globais ---

const mockValidateCronRequest = vi.fn().mockReturnValue(true)
const mockCronUnauthorized = vi.fn().mockReturnValue(
  Response.json({ ok: false, error: 'AUTH_001' }, { status: 401 })
)

vi.mock('@/lib/cron-guard', () => ({
  validateCronRequest: (...args: unknown[]) => mockValidateCronRequest(...args),
  cronUnauthorized: (...args: unknown[]) => mockCronUnauthorized(...args),
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const mockPrisma = {
  retrievalCode: { findMany: vi.fn().mockResolvedValue([]), update: vi.fn() },
  donation: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
  user: { findMany: vi.fn().mockResolvedValue([]) },
  abuseRecord: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
}
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

const mockRetrievalService = { expireCode: vi.fn().mockResolvedValue(undefined) }
vi.mock('@/services/retrieval.service', () => ({ retrievalService: mockRetrievalService }))

const mockNotificationService = { sendExpirationWarning: vi.fn().mockResolvedValue(undefined) }
vi.mock('@/services/notification.service', () => ({ notificationService: mockNotificationService }))

const mockMetricsService = {
  calculateRealtimeMetrics: vi.fn().mockResolvedValue({ totalMeals: 100 }),
  saveMetricsSnapshot: vi.fn().mockResolvedValue(undefined),
}
vi.mock('@/services/metrics.service', () => ({ metricsService: mockMetricsService }))

const mockGamificationService = {
  processMonthlyCycle: vi.fn().mockResolvedValue({ badgesAwarded: 5, processed: 10, errors: [] }),
}
vi.mock('@/services/gamification.service', () => ({ gamificationService: mockGamificationService }))

const mockAnonymizeUser = vi.fn().mockResolvedValue(undefined)
vi.mock('@/services/lgpd.service', () => ({ anonymizeUser: mockAnonymizeUser }))

const mockMpConnectionRepository = { findExpiringSoon: vi.fn().mockResolvedValue([]) }
vi.mock('@/repositories/mp-connection.repository', () => ({ mpConnectionRepository: mockMpConnectionRepository }))

const mockRefreshMPToken = vi.fn().mockResolvedValue(undefined)
vi.mock('@/services/mercadopago.service', () => ({ refreshMPToken: mockRefreshMPToken }))

const mockDiplomaService = {
  generateAllYearDiplomas: vi.fn().mockResolvedValue({ generated: 3, skipped: 1, errors: [] }),
}
vi.mock('@/services/diploma.service', () => ({ diplomaService: mockDiplomaService }))

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/v1/internal/crons/test', { method: 'POST' })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockValidateCronRequest.mockReturnValue(true)
  // Reset prisma defaults
  mockPrisma.retrievalCode.findMany.mockResolvedValue([])
  mockPrisma.donation.updateMany.mockResolvedValue({ count: 0 })
  mockPrisma.user.findMany.mockResolvedValue([])
  mockPrisma.abuseRecord.deleteMany.mockResolvedValue({ count: 0 })
})

// ---------- expire-donations ----------

describe('cron:expire-donations', () => {
  it('retorna 200 com contagens quando não há itens', async () => {
    const { POST } = await import('@/app/api/v1/internal/crons/expire-donations/route')
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.processedCodes).toBe(0)
    expect(body.expiredDonations).toBe(0)
  })

  it('processa codes expirados via Promise.allSettled', async () => {
    mockPrisma.retrievalCode.findMany.mockResolvedValueOnce([{ id: 'c1' }, { id: 'c2' }])
    mockRetrievalService.expireCode
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('fail'))

    const { POST } = await import('@/app/api/v1/internal/crons/expire-donations/route')
    const res = await POST(makeRequest())
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.codesExpired).toBe(1)
    expect(body.codesFailed).toBe(1)
  })

  it('retorna 401 quando não autenticado', async () => {
    mockValidateCronRequest.mockReturnValue(false)

    const { POST } = await import('@/app/api/v1/internal/crons/expire-donations/route')
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })
})

// ---------- expire-warning ----------

describe('cron:expire-warning', () => {
  it('retorna 200 com warned=0 quando não há códigos', async () => {
    const { POST } = await import('@/app/api/v1/internal/crons/expire-warning/route')
    const res = await POST(makeRequest())
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.warned).toBe(0)
  })

  it('continua processando após falha individual', async () => {
    mockPrisma.retrievalCode.findMany.mockResolvedValueOnce([{ id: 'c1' }, { id: 'c2' }])
    mockNotificationService.sendExpirationWarning
      .mockRejectedValueOnce(new Error('send fail'))
      .mockResolvedValueOnce(undefined)

    const { POST } = await import('@/app/api/v1/internal/crons/expire-warning/route')
    const res = await POST(makeRequest())
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.warned).toBe(1)
    expect(body.failed).toBe(1)
  })
})

// ---------- calculate-metrics ----------

describe('cron:calculate-metrics', () => {
  it('retorna 200 com snapshot', async () => {
    const { POST } = await import('@/app/api/v1/internal/crons/calculate-metrics/route')
    const res = await POST(makeRequest())
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.snapshot).toBeDefined()
  })

  it('retorna 500 em erro do service', async () => {
    mockMetricsService.calculateRealtimeMetrics.mockRejectedValueOnce(new Error('db down'))

    const { POST } = await import('@/app/api/v1/internal/crons/calculate-metrics/route')
    const res = await POST(makeRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.ok).toBe(false)
  })
})

// ---------- calculate-badges ----------

describe('cron:calculate-badges', () => {
  it('retorna 200 com badges e mês anterior', async () => {
    const { POST } = await import('@/app/api/v1/internal/crons/calculate-badges/route')
    const res = await POST(makeRequest())
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.badgesAwarded).toBe(5)
    expect(typeof body.month).toBe('number')
    expect(typeof body.year).toBe('number')
  })

  it('retorna 500 em erro do service', async () => {
    mockGamificationService.processMonthlyCycle.mockRejectedValueOnce(new Error('fail'))

    const { POST } = await import('@/app/api/v1/internal/crons/calculate-badges/route')
    const res = await POST(makeRequest())
    expect(res.status).toBe(500)
  })
})

// ---------- lgpd-cleanup ----------

describe('cron:lgpd-cleanup', () => {
  it('retorna 200 com anonymized=0 quando não há usuários elegíveis', async () => {
    const { POST } = await import('@/app/api/v1/internal/crons/lgpd-cleanup/route')
    const res = await POST(makeRequest())
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.anonymized).toBe(0)
  })

  it('conta corretamente fulfilled vs rejected no allSettled', async () => {
    mockPrisma.user.findMany.mockResolvedValueOnce([{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }])
    mockAnonymizeUser
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(undefined)

    const { POST } = await import('@/app/api/v1/internal/crons/lgpd-cleanup/route')
    const res = await POST(makeRequest())
    const body = await res.json()
    expect(body.anonymized).toBe(2)
    expect(body.failed).toBe(1)
  })
})

// ---------- abuse-cleanup ----------

describe('cron:abuse-cleanup', () => {
  it('retorna 200 com deleted count', async () => {
    mockPrisma.abuseRecord.deleteMany.mockResolvedValueOnce({ count: 5 })

    const { POST } = await import('@/app/api/v1/internal/crons/abuse-cleanup/route')
    const res = await POST(makeRequest())
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.deleted).toBe(5)
  })

  it('retorna 500 em erro do prisma', async () => {
    mockPrisma.abuseRecord.deleteMany.mockRejectedValueOnce(new Error('db error'))

    const { POST } = await import('@/app/api/v1/internal/crons/abuse-cleanup/route')
    const res = await POST(makeRequest())
    expect(res.status).toBe(500)
  })
})

// ---------- refresh-mp-tokens ----------

describe('cron:refresh-mp-tokens', () => {
  it('retorna 200 com contagens de refresh', async () => {
    mockMpConnectionRepository.findExpiringSoon.mockResolvedValueOnce([{ id: 'mp1' }, { id: 'mp2' }])
    mockRefreshMPToken.mockResolvedValue(undefined)

    const { POST } = await import('@/app/api/v1/internal/crons/refresh-mp-tokens/route')
    const res = await POST(makeRequest())
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.refreshed).toBe(2)
    expect(body.failed).toBe(0)
  })

  it('isola falhas individuais sem abortar', async () => {
    mockMpConnectionRepository.findExpiringSoon.mockResolvedValueOnce([{ id: 'mp1' }, { id: 'mp2' }])
    mockRefreshMPToken
      .mockRejectedValueOnce(new Error('token fail'))
      .mockResolvedValueOnce(undefined)

    const { POST } = await import('@/app/api/v1/internal/crons/refresh-mp-tokens/route')
    const res = await POST(makeRequest())
    const body = await res.json()
    expect(body.refreshed).toBe(1)
    expect(body.failed).toBe(1)
  })
})

// ---------- generate-diplomas ----------

describe('cron:generate-diplomas', () => {
  it('retorna 200 com diplomas gerados', async () => {
    const { POST } = await import('@/app/api/v1/internal/crons/generate-diplomas/route')
    const res = await POST(makeRequest())
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.generated).toBe(3)
    expect(body.skipped).toBe(1)
  })

  it('retorna 500 em timeout/failure', async () => {
    mockDiplomaService.generateAllYearDiplomas.mockRejectedValueOnce(new Error('timeout'))

    const { POST } = await import('@/app/api/v1/internal/crons/generate-diplomas/route')
    const res = await POST(makeRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('TIMEOUT_OR_FAILURE')
  })
})
