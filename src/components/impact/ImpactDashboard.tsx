'use client'

import dynamic from 'next/dynamic'
import { MetricCard } from './MetricCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Utensils, Store, Users, Package, Leaf, TreePine } from 'lucide-react'
import type { RealtimeMetrics, MetricsHistoryEntry } from '@/types/metrics.types'

const HistoryChart = dynamic(
  () => import('./HistoryChart').then((m) => m.HistoryChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 bg-[var(--color-muted-raw)]/30 rounded-md animate-pulse" />
    ),
  }
)

interface ImpactDashboardProps {
  metrics: RealtimeMetrics
  history: MetricsHistoryEntry[]
}

export function ImpactDashboard({ metrics, history }: ImpactDashboardProps) {
  return (
    <div className="space-y-10">
      {/* Grid de MetricCards */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        role="list"
        aria-label="Metricas de impacto do Prato Solidario"
      >
        {/* Must */}
        <MetricCard
          icon={<Utensils className="h-8 w-8" />}
          value={metrics.totalMealsDistributed}
          label="Refeicoes Distribuidas"
        />
        <MetricCard
          icon={<Store className="h-8 w-8" />}
          value={metrics.activeMarmitarias}
          label="Marmitarias Parceiras"
        />
        <MetricCard
          icon={<Users className="h-8 w-8" />}
          value={metrics.totalUsers}
          label="Usuarios Ativos"
        />
        <MetricCard
          icon={<Package className="h-8 w-8" />}
          value={metrics.activeDonationsToday}
          label="Doacoes Disponiveis Hoje"
        />
        {/* Should — impacto ambiental */}
        <MetricCard
          icon={<Leaf className="h-8 w-8" />}
          value={metrics.kgFoodSaved}
          label="Kg de Alimento Salvo"
          unit="kg"
          isShould
        />
        <MetricCard
          icon={<TreePine className="h-8 w-8" />}
          value={metrics.kgCO2Avoided}
          label="Kg de CO2 Evitado"
          unit="kg CO2"
          isShould
        />
      </div>

      {/* Grafico de historico (ultimos 30 dias) */}
      {history.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-[var(--color-text-primary)]">
            Evolucao nos ultimos 30 dias
          </h2>
          <HistoryChart history={history} />
        </div>
      )}

      {/* Estado empty quando nao ha snapshots ainda */}
      {history.length === 0 && (
        <div className="text-center py-8 text-[var(--color-text-secondary)]">
          <p>Historico disponivel apos o primeiro snapshot diario.</p>
        </div>
      )}
    </div>
  )
}
