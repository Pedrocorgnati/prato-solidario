/**
 * HeatmapFallback — lista textual rankeada de regiões.
 * Exibido quando: Mapbox GL JS falha ao carregar, erro de rede ou prefers-reduced-motion.
 * Acessível: <ol> semântico, intensidade comunicada por texto E emoji (não só cor).
 *
 * @see module-21-heatmap/TASK-2/ST003
 */

import type { HeatmapCell } from './types'

interface HeatmapFallbackProps {
  cells: HeatmapCell[]
  error?: string
}

function intensityEmoji(intensity: number): string {
  if (intensity >= 0.67) return '🔴'
  if (intensity >= 0.34) return '🟡'
  return '🟢'
}

function intensityLabel(intensity: number): string {
  if (intensity >= 0.67) return 'Alta necessidade'
  if (intensity >= 0.34) return 'Média necessidade'
  return 'Baixa necessidade'
}

export function HeatmapFallback({ cells, error }: HeatmapFallbackProps) {
  const sorted = [...cells]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 10)

  return (
    <div
      className="rounded-lg border border-border bg-card p-4"
      role="region"
      aria-label="Lista de regiões por necessidade"
    >
      <p className="mb-3 text-sm text-muted-foreground">
        {error ?? 'Mapa indisponível'} — exibindo lista de regiões
      </p>

      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Ainda não há dados suficientes para exibir regiões.
        </p>
      ) : (
        <>
          <p className="mb-2 text-sm font-medium">
            Regiões com maior necessidade (últimos 30 dias):
          </p>
          <ol className="space-y-2" aria-label="Regiões rankeadas por intensidade">
            {sorted.map((cell, index) => (
              <li key={`${cell.lat}-${cell.lng}`} className="flex items-start gap-2 text-sm">
                <span aria-hidden="true">{intensityEmoji(cell.intensity)}</span>
                <span className="flex-1">
                  <span className="font-medium">Região {index + 1}</span>
                  <span className="sr-only"> — {intensityLabel(cell.intensity)}</span>
                  <span className="text-muted-foreground">
                    {' '}— {intensityLabel(cell.intensity)}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    (Doações: {cell.donationCount} | Demanda: {cell.retrievalCount})
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
