/**
 * Testes unitários — MetricsService
 * @see module-19-metricas-impacto/TASK-1/ST005
 *
 * Cenários:
 *   (a) kgFoodSaved = totalMeals * 0.5 (regra canônica FEAT-EN-002)
 *   (b) kgCO2Avoided = kgFoodSaved * 2.5 (fator IPCC AR6 FEAT-EN-008)
 *   (c) totalMeals = 0 → zeros, sem divisão por zero
 *   (d) modo degradado quando repository falha — retorna zeros sem lançar
 *   (e) saveMetricsSnapshot chama calculateRealtimeMetrics + saveSnapshot
 *
 * Pré-requisito: vitest instalado (pnpm add -D vitest @vitest/coverage-v8)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/repositories/metrics.repository', () => ({
  metricsRepository: {
    getRealtimeMetrics: vi.fn(),
    saveSnapshot: vi.fn(),
    getHistory: vi.fn(),
    getTopDonors: vi.fn(),
  },
}))

import { metricsRepository } from '@/repositories/metrics.repository'
import { MetricsService } from '@/services/metrics.service'

const mockRepo = metricsRepository as {
  getRealtimeMetrics: ReturnType<typeof vi.fn>
  saveSnapshot: ReturnType<typeof vi.fn>
  getHistory: ReturnType<typeof vi.fn>
  getTopDonors: ReturnType<typeof vi.fn>
}

describe('MetricsService', () => {
  let service: MetricsService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new MetricsService()
  })

  describe('calculateRealtimeMetrics', () => {
    it('deve calcular kgFoodSaved = totalMeals * 0.5', async () => {
      mockRepo.getRealtimeMetrics.mockResolvedValueOnce({
        totalMealsDistributed: 10,
        activeDonationsToday: 3,
        activeMarmitarias: 5,
        totalUsers: 100,
      })

      const result = await service.calculateRealtimeMetrics()

      expect(result.kgFoodSaved).toBe(5.0)
    })

    it('deve calcular kgCO2Avoided = kgFoodSaved * 2.5', async () => {
      mockRepo.getRealtimeMetrics.mockResolvedValueOnce({
        totalMealsDistributed: 10,
        activeDonationsToday: 0,
        activeMarmitarias: 2,
        totalUsers: 50,
      })

      const result = await service.calculateRealtimeMetrics()

      // 10 refeições → 5.0 kg alimento → 12.5 kg CO₂
      expect(result.kgFoodSaved).toBe(5.0)
      expect(result.kgCO2Avoided).toBe(12.5)
    })

    it('deve retornar zeros quando totalMeals = 0 (sem divisão por zero)', async () => {
      mockRepo.getRealtimeMetrics.mockResolvedValueOnce({
        totalMealsDistributed: 0,
        activeDonationsToday: 0,
        activeMarmitarias: 0,
        totalUsers: 0,
      })

      const result = await service.calculateRealtimeMetrics()

      expect(result.kgFoodSaved).toBe(0)
      expect(result.kgCO2Avoided).toBe(0)
      expect(result.totalMealsDistributed).toBe(0)
    })

    it('deve retornar modo degradado (zeros) quando repository falha', async () => {
      mockRepo.getRealtimeMetrics.mockRejectedValueOnce(new Error('DB connection lost'))

      const result = await service.calculateRealtimeMetrics()

      expect(result.totalMealsDistributed).toBe(0)
      expect(result.activeDonationsToday).toBe(0)
      expect(result.activeMarmitarias).toBe(0)
      expect(result.totalUsers).toBe(0)
      expect(result.kgFoodSaved).toBe(0)
      expect(result.kgCO2Avoided).toBe(0)
      expect(result.lastUpdated).toBeInstanceOf(Date)
    })

    it('deve incluir lastUpdated como Date', async () => {
      mockRepo.getRealtimeMetrics.mockResolvedValueOnce({
        totalMealsDistributed: 5,
        activeDonationsToday: 1,
        activeMarmitarias: 2,
        totalUsers: 20,
      })

      const result = await service.calculateRealtimeMetrics()

      expect(result.lastUpdated).toBeInstanceOf(Date)
    })
  })

  describe('saveMetricsSnapshot', () => {
    it('deve chamar calculateRealtimeMetrics e saveSnapshot com dados corretos', async () => {
      mockRepo.getRealtimeMetrics.mockResolvedValueOnce({
        totalMealsDistributed: 20,
        activeDonationsToday: 5,
        activeMarmitarias: 3,
        totalUsers: 200,
      })
      mockRepo.saveSnapshot.mockResolvedValueOnce(undefined)

      await service.saveMetricsSnapshot()

      expect(mockRepo.saveSnapshot).toHaveBeenCalledOnce()
      expect(mockRepo.saveSnapshot).toHaveBeenCalledWith({
        totalMealsDistributed: 20,
        activeMarmitarias: 3,
        totalUsers: 200,
      })
    })
  })
})
