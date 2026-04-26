/**
 * ImpactTrendChart — barras CSS simples para tendência de impacto mensal.
 * Sem biblioteca de gráficos pesada — usa apenas divs com altura relativa.
 * @see intake-review/TASK-16/ST004
 */
interface TrendEntry {
  label: string
  mealsThisMonth: number
}

interface ImpactTrendChartProps {
  data: TrendEntry[]
  className?: string
}

export function ImpactTrendChart({ data, className }: ImpactTrendChartProps) {
  const max = Math.max(...data.map((d) => d.mealsThisMonth), 1)

  return (
    <div
      data-testid="impact-trend-chart"
      aria-label="Gráfico de tendência de refeições por mês"
      role="img"
      className={`flex items-end gap-1 h-24 ${className ?? ''}`}
    >
      {data.map((entry, idx) => {
        const heightPct = Math.round((entry.mealsThisMonth / max) * 100)
        const isLast = idx === data.length - 1

        return (
          <div key={entry.label} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div
              className={`w-full rounded-t transition-all duration-300 ${
                isLast ? 'bg-green-600' : 'bg-green-200'
              }`}
              style={{ height: `${heightPct}%`, minHeight: '2px' }}
              title={`${entry.label}: ${entry.mealsThisMonth} refeições`}
            />
            <span className="text-[10px] text-[var(--color-text-muted)] truncate w-full text-center">
              {entry.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
