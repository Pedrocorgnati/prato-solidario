/**
 * Constantes de calculo de metricas de impacto.
 * Fonte: INTAKE FEAT-EN-002 (peso refeicao) e FEAT-EN-008 (fator IPCC AR6).
 *
 * REGRA: Todas as formulas de impacto ambiental devem referenciar estas constantes.
 * Nao usar magic numbers (0.5, 2.5) diretamente no codigo.
 */
export const METRICS_FACTORS = {
  /** Peso por refeicao em kg (500g = 0.5 kg) — INTAKE FEAT-EN-002 */
  KG_PER_MEAL: 0.5,
  /** Fator CO2eq/kg residuo organico evitado — IPCC AR6 */
  CO2_FACTOR_IPCC: 2.5,
} as const
