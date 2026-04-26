/**
 * MonthlyImpactCard — exibe dados de impacto de um mês específico.
 * @see intake-review/TASK-16/ST004
 */
interface MonthlyImpactCardProps {
  label: string
  mealsThisMonth: number
  kgFoodSaved: number
  kgCO2Avoided: number
  isCurrentMonth?: boolean
}

export function MonthlyImpactCard({
  label,
  mealsThisMonth,
  kgFoodSaved,
  kgCO2Avoided,
  isCurrentMonth = false,
}: MonthlyImpactCardProps) {
  return (
    <div
      data-testid="monthly-impact-card"
      className={`rounded-lg border px-4 py-3 text-center ${
        isCurrentMonth
          ? 'border-green-500 bg-green-50'
          : 'border-[var(--color-border-raw)] bg-[var(--color-background-raw)]'
      }`}
    >
      <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">{label}</p>
      <p className="text-2xl font-bold text-[var(--color-text-primary)]">{mealsThisMonth}</p>
      <p className="text-xs text-[var(--color-text-secondary)] mb-1">refeições</p>
      <div className="mt-2 space-y-0.5">
        <p className="text-xs text-green-700">
          🌱 {kgFoodSaved} kg alimento salvo
        </p>
        <p className="text-xs text-blue-600">
          💨 {kgCO2Avoided} kg CO₂ evitado
        </p>
      </div>
    </div>
  )
}
