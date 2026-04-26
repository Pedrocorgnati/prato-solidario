export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import {
  HandCoins,
  UtensilsCrossed,
  ChefHat,
  Image as ImageIcon,
  DollarSign,
  Users,
} from 'lucide-react'
import { getAdminMetrics } from './get-metrics'
import { KpiCard } from './components/KpiCard'
import { DonationChart } from './components/DonationChart'
import { RecentActivity } from './components/RecentActivity'
import { SystemHealth } from './components/SystemHealth'
import { formatCurrency, formatNumber } from '@/utils/formatters'

export const metadata: Metadata = {
  title: 'Dashboard Admin — Prato Solidário',
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiCard key={i} title="" value="" isLoading />
        ))}
      </div>
      <div className="h-[280px] animate-pulse rounded-lg bg-[var(--color-muted-raw)]" />
    </div>
  )
}

async function DashboardContent() {
  const metrics = await getAdminMetrics()

  const kpis = [
    {
      title: 'Doações hoje',
      value: formatNumber(metrics.doacoesHoje),
      icon: <HandCoins className="h-5 w-5" />,
      trend: metrics.doacoesHoje > 0 ? ('up' as const) : ('stable' as const),
    },
    {
      title: 'Refeições na semana',
      value: formatNumber(metrics.refeicoesSemana),
      icon: <UtensilsCrossed className="h-5 w-5" />,
    },
    {
      title: 'Marmitarias ativas',
      value: formatNumber(metrics.marmitariasAtivas),
      icon: <ChefHat className="h-5 w-5" />,
    },
    {
      title: 'Banners ativos',
      value: formatNumber(metrics.bannersAtivos),
      icon: <ImageIcon className="h-5 w-5" />,
    },
    {
      title: 'Receita no mês',
      value: formatCurrency(metrics.receitaBannersMes / 100),
      icon: <DollarSign className="h-5 w-5" />,
      subtitle: 'Patrocínios aprovados',
    },
    {
      title: 'Usuários cadastrados',
      value: formatNumber(metrics.usuariosCadastrados),
      icon: <Users className="h-5 w-5" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div
        data-testid="dashboard-kpis"
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6"
      >
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            trend={kpi.trend}
            subtitle={kpi.subtitle}
          />
        ))}
      </div>

      {/* Gráfico de doações */}
      <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-surface)] p-4">
        <h2 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">
          Doações nos últimos 7 dias
        </h2>
        <DonationChart data={metrics.doacoesPorDia} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div data-testid="admin-dashboard-v2" className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        Dashboard Admin
      </h1>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>

      {/* Painéis com polling próprio (Client Components) */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentActivity />
        <SystemHealth />
      </div>
    </div>
  )
}
