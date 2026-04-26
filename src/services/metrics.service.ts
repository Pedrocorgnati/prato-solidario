/**
 * MetricsService — lógica de negócio para métricas de impacto.
 *
 * Regras canônicas (INTAKE FEAT-EN-002, FEAT-EN-008):
 *   kgFoodSaved  = totalMealsDistributed × 0,5 kg   (500g por refeição)
 *   kgCO2Avoided = kgFoodSaved × 2,5               (fator IPCC AR6)
 *
 * @see module-19-metricas-impacto/TASK-1/ST003
 */

import { metricsRepository } from '@/repositories/metrics.repository'
import { METRICS_FACTORS } from '@/lib/constants/metrics'
import type { RealtimeMetrics, MetricsHistoryEntry, TopDonor } from '@/types/metrics.types'

export class MetricsService {
  /**
   * Calcula métricas em tempo real com fórmulas de impacto ambiental.
   * Em modo degradado (falha de banco), retorna zeros sem lançar exceção.
   */
  async calculateRealtimeMetrics(): Promise<RealtimeMetrics> {
    try {
      const raw = await metricsRepository.getRealtimeMetrics()

      // Regra canônica: 500g por refeição (INTAKE FEAT-EN-002)
      const kgFoodSaved = raw.totalMealsDistributed * METRICS_FACTORS.KG_PER_MEAL

      // Regra canônica: fator IPCC AR6 = 2,5 kg CO₂eq/kg resíduo orgânico
      const kgCO2Avoided = kgFoodSaved * METRICS_FACTORS.CO2_FACTOR_IPCC

      return {
        ...raw,
        kgFoodSaved,
        kgCO2Avoided,
        lastUpdated: new Date(),
      }
    } catch (error) {
      console.error('[MetricsService] Falha ao calcular métricas:', error)
      // Modo degradado: estrutura válida com zeros — não quebra a API pública
      return {
        totalMealsDistributed: 0,
        activeDonationsToday: 0,
        activeMarmitarias: 0,
        totalUsers: 0,
        kgFoodSaved: 0,
        kgCO2Avoided: 0,
        lastUpdated: new Date(),
      }
    }
  }

  /**
   * Persiste snapshot diário de métricas.
   * Chamado pelo cron /api/v1/internal/metrics/recalculate (module-23).
   */
  async saveMetricsSnapshot(): Promise<void> {
    try {
      const metrics = await this.calculateRealtimeMetrics()
      await metricsRepository.saveSnapshot({
        totalMealsDistributed: metrics.totalMealsDistributed,
        activeMarmitarias: metrics.activeMarmitarias,
        totalUsers: metrics.totalUsers,
      })
    } catch (error) {
      console.error('[MetricsService] Falha ao salvar snapshot:', error)
    }
  }

  /**
   * Histórico de métricas para gráfico na página pública /impacto.
   */
  async getMetricsHistory(days = 30): Promise<MetricsHistoryEntry[]> {
    return metricsRepository.getHistory(days)
  }

  /**
   * Top doadores para gamificação (module-20).
   */
  async getTopDonors(limit = 10): Promise<TopDonor[]> {
    return metricsRepository.getTopDonors(limit)
  }
}

export const metricsService = new MetricsService()
