'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { MetricsHistoryEntry } from '@/types/metrics.types'

interface HistoryChartProps {
  history: MetricsHistoryEntry[]
}

export function HistoryChart({ history }: HistoryChartProps) {
  const chartData = history.map((h) => ({
    date: new Date(h.snapshotAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
    refeicoes: h.totalMealsDistributed,
    kgAlimento: h.kgFoodSaved,
  }))

  return (
    <ResponsiveContainer width="100%" height={192}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-[var(--color-border-raw)]" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value, name) => {
            const num = Number(value)
            return name === 'refeicoes'
              ? [num.toLocaleString('pt-BR'), 'Refeicoes']
              : [`${num.toLocaleString('pt-BR')} kg`, 'Alimento']
          }}
        />
        <Line
          type="monotone"
          dataKey="refeicoes"
          stroke="#2D8659"
          strokeWidth={2}
          dot={false}
          name="refeicoes"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
