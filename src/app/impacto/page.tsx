export const dynamic = 'force-dynamic'

import { metricsService } from '@/services/metrics.service'
import { ImpactDashboard } from '@/components/impact/ImpactDashboard'
import { Suspense } from 'react'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Impacto — Prato Solidario',
  description:
    'Veja o impacto real das doacoes: refeicoes distribuidas, CO2 evitado e marmitarias parceiras em toda a rede Prato Solidario.',
  openGraph: {
    title: 'Impacto — Prato Solidario',
    description: 'Transparencia total sobre o impacto das doacoes.',
  },
}

async function ImpactContent() {
  const [metrics, history] = await Promise.all([
    metricsService.calculateRealtimeMetrics(),
    metricsService.getMetricsHistory(30),
  ])

  return <ImpactDashboard metrics={metrics} history={history} />
}

export default function ImpactoPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background-raw)]">
      {/* Hero */}
      <section className="py-16 px-4 text-center bg-[var(--color-primary-raw)]/5">
        <h1 className="text-4xl font-bold text-[var(--color-primary-raw)] mb-4">
          Nosso Impacto
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto">
          Cada doacao conta. Veja em tempo real o que estamos construindo juntos.
        </p>
      </section>

      {/* Dashboard de metricas */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <Suspense fallback={<LoadingSkeleton variant="card" count={6} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" />}>
          <ImpactContent />
        </Suspense>
      </section>

      {/* Secao de transparencia */}
      <section className="py-12 px-4 max-w-3xl mx-auto border-t border-[var(--color-border-raw)]">
        <h2 className="text-2xl font-semibold mb-4 text-[var(--color-text-primary)]">
          Como calculamos?
        </h2>
        <div className="space-y-3 text-[var(--color-text-secondary)]">
          <p>
            <strong>Refeicoes distribuidas:</strong> Total de retiradas confirmadas
            pelos beneficiarios.
          </p>
          <p>
            <strong>Kg de alimento salvo:</strong> Cada refeicao equivale a 500g de
            alimento que nao foi para o lixo.
          </p>
          <p>
            <strong>Kg de CO2 evitado:</strong> Estimativa baseada no fator do IPCC
            AR6 — 2,5 kg de CO2 equivalente por kg de residuo organico evitado.
          </p>
          <p className="text-xs italic">
            Metodologia: padrao FAO/IPCC para calculo de desperdicio alimentar.
          </p>
        </div>
      </section>

      {/* Link de retorno */}
      <div className="text-center py-8">
        <Link
          href="/"
          className="text-[var(--color-primary-raw)] hover:underline text-sm"
        >
          ← Voltar para o inicio
        </Link>
      </div>
    </main>
  )
}
