/** Tipos compartilhados para o módulo de heatmap. */

export interface HeatmapCell {
  lat: number
  lng: number
  donationCount: number
  retrievalCount: number
  /** Intensidade normalizada 0.0–1.0 */
  intensity: number
}

export interface HeatmapMetadata {
  period: string
  updated_at: string
  total_cells: number
  k_threshold: number
}

export interface HeatmapApiResponse {
  data: HeatmapCell[]
  metadata: HeatmapMetadata
}

export type LayerMode = 'donations' | 'retrievals' | 'both'
