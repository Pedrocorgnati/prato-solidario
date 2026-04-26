/**
 * Testes — GET /api/v1/metrics/public
 * @see module-19-metricas-impacto/TASK-2/ST004
 *
 * Cenários:
 *   (a) 200 com todos os campos do contrato
 *   (b) header Cache-Control: max-age=300 presente
 *   (c) sem autenticação requerida (service chamado sem guard)
 *   (d) modo degradado retorna 200 com zeros quando service falha
 *
 * Pré-requisito: vitest (pnpm add -D vitest @vitest/coverage-v8)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/metrics.service', () => ({
  metricsService: {
    calculateRealtimeMetrics: vi.fn(),
  },
}))

import { metricsService } from '@/services/metrics.service'
import { GET } from '@/app/api/v1/metrics/public/route'

const mockService = metricsService as { calculateRealtimeMetrics: ReturnType<typeof vi.fn> }

const MOCK_METRICS = {
  totalMealsDistributed: 100,
  activeDonationsToday: 5,
  activeMarmitarias: 12,
  totalUsers: 250,
  kgFoodSaved: 50,
  kgCO2Avoided: 125,
  lastUpdated: new Date('2026-04-08T12:00:00Z'),
}

describe('GET /api/v1/metrics/public', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deve retornar 200 com todos os campos do contrato', async () => {
    mockService.calculateRealtimeMetrics.mockResolvedValueOnce(MOCK_METRICS)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.totalRefeicoes).toBe(100)
    expect(body.doacoesAtivas).toBe(5)
    expect(body.marmitariasParceiras).toBe(12)
    expect(body.totalUsers).toBe(250)
    expect(body.kgFoodSaved).toBe(50)
    expect(body.kgCO2Avoided).toBe(125)
    expect(body.updatedAt).toBe('2026-04-08T12:00:00.000Z')
  })

  it('deve incluir header Cache-Control com s-maxage=300', async () => {
    mockService.calculateRealtimeMetrics.mockResolvedValueOnce(MOCK_METRICS)

    const res = await GET()

    expect(res.headers.get('cache-control')).toContain('s-maxage=300')
  })

  it('deve funcionar sem autenticação (sem guard de sessão)', async () => {
    mockService.calculateRealtimeMetrics.mockResolvedValueOnce(MOCK_METRICS)

    // Apenas verifica que responde 200 sem nenhum header de auth
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it('deve retornar 200 com zeros em modo degradado quando service falha', async () => {
    mockService.calculateRealtimeMetrics.mockRejectedValueOnce(new Error('DB down'))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.totalRefeicoes).toBe(0)
    expect(body.doacoesAtivas).toBe(0)
    expect(body.marmitariasParceiras).toBe(0)
    expect(body.updatedAt).toBeNull()
    expect(body.kgFoodSaved).toBe(0)
    expect(body.kgCO2Avoided).toBe(0)
  })
})
