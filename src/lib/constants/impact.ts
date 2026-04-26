/**
 * Constantes de impacto ambiental/social.
 * Fonte: IPCC AR6 — fator de emissão para alimentos evitados de desperdício.
 * @see intake-review/TASK-16/ST001
 */

/** Peso médio de alimentos por refeição (kg) — Fonte: ABREU et al. 2019 */
export const KG_PER_MEAL = 0.5

/**
 * Fator de emissão CO₂ equivalente por kg de alimento desperdiçado (kgCO₂eq/kg).
 * Fonte: IPCC AR6 / FAO 2019 (média de alimentos processados e in natura).
 */
export const CO2_FACTOR_IPCC = 2.5

/**
 * Calcula kg de alimento salvo a partir do número de refeições.
 */
export function calcKgFoodSaved(totalMeals: number): number {
  return Math.round(totalMeals * KG_PER_MEAL * 100) / 100
}

/**
 * Calcula kg de CO₂ evitado a partir do número de refeições.
 */
export function calcKgCO2Avoided(totalMeals: number): number {
  return Math.round(totalMeals * KG_PER_MEAL * CO2_FACTOR_IPCC * 100) / 100
}
