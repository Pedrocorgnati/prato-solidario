'use client'

/**
 * Client Component wrapper para o DemandHeatmap.
 * Necessário porque `ssr: false` só é permitido em Client Components no Next.js 16.
 */

import dynamic from 'next/dynamic'

const DemandHeatmap = dynamic(
  () => import('@/components/map/DemandHeatmap').then((m) => m.DemandHeatmap),
  {
    ssr: false,
    loading: () => (
      <div
        className="animate-pulse rounded-lg bg-muted min-h-[300px] h-[60vh]"
        aria-label="Carregando mapa de impacto"
        role="status"
      />
    ),
  },
)

export function MapaClient({ className }: { className?: string }) {
  return <DemandHeatmap className={className} />
}
