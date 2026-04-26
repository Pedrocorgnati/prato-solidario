'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { EmptyState } from '@/components/ui/empty-state'
import { BarChart3 } from 'lucide-react'

interface DonationChartProps {
  data: { date: string; count: number }[]
}

function formatXAxisDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

function formatTooltipDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

interface TooltipPayloadItem {
  value: number
  payload: { date: string; count: number }
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-md border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-[var(--color-text-primary)]">
        {item.value} {item.value === 1 ? 'doação' : 'doações'}
      </p>
      <p className="text-xs text-[var(--color-text-muted)]">
        em {formatTooltipDate(item.payload.date)}
      </p>
    </div>
  )
}

export function DonationChart({ data }: DonationChartProps) {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-8 w-8" />}
        title="Nenhuma doação nos últimos 7 dias"
      />
    )
  }

  return (
    <div
      role="img"
      aria-label="Gráfico de doações dos últimos 7 dias"
      className="h-[280px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-raw)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxisDate}
            tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
            stroke="var(--color-border-raw)"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
            stroke="var(--color-border-raw)"
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--color-primary-raw)"
            strokeWidth={2}
            dot={{ r: 4, fill: 'var(--color-primary-raw)' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
