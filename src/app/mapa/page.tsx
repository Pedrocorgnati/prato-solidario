/**
 * Página /mapa — Mapa de Impacto público.
 *
 * Server Component com generateMetadata.
 * O mapa em si (DemandHeatmap) é Client Component importado dinamicamente.
 *
 * @see module-21-heatmap/TASK-2/ST006
 */

import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { MapaClient } from './MapaClient'

export const metadata: Metadata = {
  title: 'Mapa de Impacto | Prato Solidário',
  description:
    'Veja o mapa de doações e demandas por região no Brasil. Dados agregados por região — sem identificação individual.',
}

export default function MapaPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Mapa de Impacto</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Visualize onde as doações e a necessidade se concentram no Brasil
        </p>
      </div>

      {/* Mapa */}
      <MapaClient className="min-h-[300px] h-[60vh]" />

      {/* Nota de privacidade */}
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground italic">
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p>Dados agregados por região — sem identificação individual</p>
      </div>

      {/* Como interpretar o mapa */}
      <section className="mt-8 rounded-lg border border-border bg-card p-6">
        <h2 className="mb-3 text-lg font-semibold">Como interpretar o mapa</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-red-500" aria-hidden="true" />
            <span><strong>Alta concentração</strong> — regiões com grande volume de atividade solidária</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-yellow-500" aria-hidden="true" />
            <span><strong>Média concentração</strong> — presença moderada de doações e demanda</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-green-500" aria-hidden="true" />
            <span><strong>Baixa concentração</strong> — atividade em crescimento</span>
          </p>
          <p className="mt-3 text-xs">
            Células com menos de 3 eventos são omitidas para proteger a privacidade dos participantes.
          </p>
        </div>
      </section>
    </main>
  )
}
