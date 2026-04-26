/**
 * Tipos e DTOs para métricas de impacto (module-19).
 * @see module-19-metricas-impacto/TASK-1/ST001
 * @see Contrato 8 — ImpactMetrics compartilhado com module-18 e module-8
 */

/** Métricas calculadas em tempo real a partir do banco. */
export interface RealtimeMetrics {
  /** SUM(RetrievalCode.portions WHERE status=CONFIRMED) */
  totalMealsDistributed: number
  /** COUNT(Donation WHERE status=AVAILABLE AND createdAt >= hoje) */
  activeDonationsToday: number
  /** COUNT(MarmitariaProfile WHERE status=ACTIVE) */
  activeMarmitarias: number
  /** COUNT(User WHERE isActive=true AND deletedAt IS NULL) */
  totalUsers: number
  /** Should: totalMealsDistributed * 0.5 (kg, fator 500g/refeição) */
  kgFoodSaved: number
  /** Should: kgFoodSaved * 2.5 (kg CO₂eq, fator IPCC AR6) */
  kgCO2Avoided: number
  lastUpdated: Date
}

/** Snapshot diário persistido no modelo ImpactMetrics do banco. */
export interface MetricsSnapshot {
  id: string
  snapshotAt: Date
  totalMealsDistributed: number
  activeMarmitarias: number
  totalUsers: number
  kgFoodSaved: number
  kgCO2Avoided: number
}

/** Top doador para gamificação (module-20). */
export interface TopDonor {
  userId: string
  displayName: string
  avatarUrl: string | null
  city: string
  totalMeals: number
  rank: number
}

/** Entrada de histórico para gráfico de evolução na página /impacto. */
export interface MetricsHistoryEntry {
  snapshotAt: Date
  totalMealsDistributed: number
  kgFoodSaved: number
  kgCO2Avoided: number
}
