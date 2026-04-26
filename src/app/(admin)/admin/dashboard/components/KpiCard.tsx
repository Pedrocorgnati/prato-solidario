import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'stable'
  icon?: React.ReactNode
  isLoading?: boolean
}

const trendConfig = {
  up: { Icon: ArrowUpRight, color: 'text-emerald-600', label: 'aumento' },
  down: { Icon: ArrowDownRight, color: 'text-red-500', label: 'queda' },
  stable: { Icon: Minus, color: 'text-[var(--color-text-muted)]', label: 'estável' },
} as const

export function KpiCard({ title, value, subtitle, trend, icon, isLoading }: KpiCardProps) {
  if (isLoading) {
    return (
      <div
        className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-surface)] p-4 space-y-3"
        aria-busy="true"
        aria-label="Carregando..."
      >
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--color-muted-raw)]" />
        <div className="h-8 w-16 animate-pulse rounded bg-[var(--color-muted-raw)]" />
        <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-muted-raw)]" />
      </div>
    )
  }

  const trendLabel = trend
    ? `, tendência: ${trendConfig[trend].label}`
    : ''

  return (
    <div
      className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-surface)] p-4 space-y-1"
      aria-label={`${title}: ${value}${trendLabel}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">{title}</p>
        {icon && (
          <div className="text-[var(--color-text-muted)]">{icon}</div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-[var(--color-text-primary)]">{value}</p>
        {trend && (
          <span className={trendConfig[trend].color}>
            {(() => {
              const { Icon } = trendConfig[trend]
              return <Icon className="h-5 w-5" aria-hidden="true" />
            })()}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-[var(--color-text-muted)]">{subtitle}</p>
      )}
    </div>
  )
}
