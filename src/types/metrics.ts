/**
 * ImpactMetrics — contrato compartilhado entre module-18 (landing) e module-19 (métricas).
 * @see module-18-landing-page/TASK-0/ST002 (contrato cross-rock CR-X-08)
 * @see module-19-metricas-impacto/TASK-2 (campos expandidos)
 */
export interface ImpactMetrics {
  /** Legacy: total de refeições distribuídas (SUM RetrievalCode.portions CONFIRMED) */
  totalRefeicoes: number
  /** Legacy: doações disponíveis hoje */
  doacoesAtivas: number
  /** Legacy: marmitarias parceiras ativas */
  marmitariasParceiras: number
  updatedAt: string | null
  // Campos expandidos pelo module-19 (opcionais para manter backward compat)
  /** Should: total de usuários ativos */
  totalUsers?: number
  /** Should: kg de alimento salvo (totalRefeicoes * 0.5) */
  kgFoodSaved?: number
  /** Should: kg de CO₂ evitado (kgFoodSaved * 2.5, fator IPCC AR6) */
  kgCO2Avoided?: number
}
