'use client'

import { formatNumber } from '@/utils/formatters'
import { METRICS_FACTORS } from '@/lib/constants/metrics'

function getEquivalences(kgCO2: number) {
  const carKm = kgCO2 / 0.21 // 210g CO2/km (carro medio Brasil)
  const trees = kgCO2 / 21.7 // arvore absorve ~21.7 kg CO2/ano

  const equivalences: string[] = []
  if (carKm >= 1) {
    equivalences.push(`${formatNumber(carKm, 0)} km de carro nao percorridos`)
  }
  if (trees >= 0.1) {
    equivalences.push(
      `${formatNumber(trees, 1)} arvores plantadas por 1 ano`
    )
  }
  return equivalences
}

interface EnvironmentalMetricProps {
  userId?: string
  data?: {
    totalMeals: number
    kgFoodSaved: number
    kgCO2Avoided: number
  }
  className?: string
}

export function EnvironmentalMetric({
  userId,
  data,
  className,
}: EnvironmentalMetricProps) {
  const metrics = data

  if (!metrics || metrics.totalMeals === 0) {
    return (
      <div
        className={`p-4 rounded-md bg-[var(--color-muted-raw)]/30 text-center ${className ?? ''}`}
      >
        <p className="text-sm text-[var(--color-text-secondary)]">
          {userId
            ? 'Comece a doar para ver seu impacto ambiental!'
            : 'Ainda sem impacto registrado.'}
        </p>
      </div>
    )
  }

  const equivalences = getEquivalences(metrics.kgCO2Avoided)

  return (
    <div
      className={`space-y-3 ${className ?? ''}`}
      role="region"
      aria-label="Impacto ambiental"
    >
      <h3 className="text-base font-semibold flex items-center gap-2 text-[var(--color-text-primary)]">
        <span aria-hidden="true">🌱</span> Impacto Ambiental
        <button
          type="button"
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          aria-label="Como calculamos o impacto ambiental"
          title={`Metodologia: ${METRICS_FACTORS.KG_PER_MEAL * 1000}g por refeicao x fator IPCC AR6 (${METRICS_FACTORS.CO2_FACTOR_IPCC} kg CO2eq/kg)`}
        >
          <span className="text-sm">&#x2139;&#xFE0F;</span>
        </button>
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-md text-center">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {formatNumber(metrics.kgFoodSaved, 1)}
            <span className="text-sm font-normal ml-1">kg</span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Alimento salvo do lixo
          </p>
        </div>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-md text-center">
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {formatNumber(metrics.kgCO2Avoided, 1)}
            <span className="text-sm font-normal ml-1">kg CO2</span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Emissoes evitadas
          </p>
        </div>
      </div>

      {equivalences.length > 0 && (
        <div className="bg-[var(--color-muted-raw)]/20 rounded-md p-3">
          <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">
            Isso equivale a:
          </p>
          <ul className="space-y-1">
            {equivalences.map((eq, i) => (
              <li key={i} className="text-sm flex items-center gap-2">
                <span aria-hidden="true">&#x2713;</span>
                {eq}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
