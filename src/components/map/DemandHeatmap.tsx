'use client'

/**
 * DemandHeatmap — mapa de calor interativo de doações e demanda.
 *
 * Client Component: Mapbox GL JS requer browser APIs.
 * Carregado via dynamic import para SSR-safe (mapbox-gl não funciona no servidor).
 *
 * Estados: loading (skeleton) | success (mapa) | empty | error-api | error-mapbox
 * Toggle: Doações / Demanda / Ambos
 * Fallback: HeatmapFallback (lista textual) quando Mapbox falha
 * Acessibilidade: aria-label, role, prefers-reduced-motion, touch targets ≥ 44px
 *
 * @see module-21-heatmap/TASK-2
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { HeatmapFallback } from './HeatmapFallback'
import type { HeatmapApiResponse, HeatmapCell, LayerMode } from './types'

const PERIODS = ['7d', '30d', '90d'] as const
type Period = (typeof PERIODS)[number]

interface DemandHeatmapProps {
  className?: string
}

interface HeatmapSource {
  setData: (data: ReturnType<typeof buildGeoJson>) => void
}

interface HeatmapMap {
  addSource: (id: string, source: unknown) => void
  addLayer: (layer: unknown) => void
  getSource: (id: string) => HeatmapSource | undefined
  on: (event: string, handler: () => void) => void
  remove: () => void
}

// Centro padrão: Brasil (Brasília)
const BRAZIL_CENTER: [number, number] = [-47.93, -15.77]
const BRAZIL_ZOOM = 4

// Gradiente: azul transparente → verde → amarelo → vermelho
const HEATMAP_COLOR = [
  'interpolate',
  ['linear'],
  ['heatmap-density'],
  0, 'rgba(0,0,255,0)',
  0.2, 'rgb(0,200,80)',
  0.4, 'rgb(255,210,0)',
  0.7, 'rgb(255,120,0)',
  1, 'rgb(255,0,0)',
]

const TOGGLE_LABELS: Record<LayerMode, string> = {
  donations: 'Doações',
  retrievals: 'Demanda',
  both: 'Ambos',
}

export function DemandHeatmap({ className }: DemandHeatmapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HeatmapMap | null>(null)

  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [apiData, setApiData] = useState<HeatmapApiResponse | null>(null)
  const [apiError, setApiError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [layer, setLayer] = useState<LayerMode>('both')
  const [period, setPeriod] = useState<Period>('30d')
  const [staleLabel, setStaleLabel] = useState<string | null>(null)
  // TASK-20: real-time refresh
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [minutesAgo, setMinutesAgo] = useState<number>(0)
  const [refreshing, setRefreshing] = useState(false)

  // Prefere reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  // Buscar dados da API
  const fetchData = useCallback(async (p: Period = period, silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setApiError(false)
    try {
      const res = await fetch(`/api/v1/metrics/heatmap?period=${p}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: HeatmapApiResponse = await res.json()
      setApiData(json)
      setLastUpdated(new Date())
      setMinutesAgo(0)

      // Verificar dados stale (> 24h)
      const updatedAt = new Date(json.metadata.updated_at)
      const ageMs = Date.now() - updatedAt.getTime()
      if (ageMs > 24 * 60 * 60 * 1000) {
        setStaleLabel(
          updatedAt.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
        )
      }
    } catch {
      setApiError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // TASK-20: auto-refresh a cada 5 minutos (300 000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(period, true)
    }, 300_000)
    return () => clearInterval(interval)
  }, [fetchData, period])

  // Atualizar contador "há X min" a cada minuto
  useEffect(() => {
    if (!lastUpdated) return
    const tick = setInterval(() => {
      const mins = Math.floor((Date.now() - lastUpdated.getTime()) / 60_000)
      setMinutesAgo(mins)
    }, 60_000)
    return () => clearInterval(tick)
  }, [lastUpdated])

  // Inicializar mapa após dados carregados
  useEffect(() => {
    if (!apiData || mapRef.current || !mapContainer.current) return
    if (apiData.data.length === 0) return // empty state — não inicializa mapa

    let map: HeatmapMap | null = null

    async function initMap() {
      try {
        const mapboxgl = (await import('mapbox-gl')).default
        await import('mapbox-gl/dist/mapbox-gl.css')

        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        if (!token) {
          setMapError(true)
          return
        }

        mapboxgl.accessToken = token

        map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: BRAZIL_CENTER,
          zoom: BRAZIL_ZOOM,
          ...(prefersReducedMotion && { fadeDuration: 0 }),
        })

        map.on('load', () => {
          addHeatmapLayer(map as HeatmapMap, apiData!.data)
          mapRef.current = map
          setMapReady(true)
        })

        map.on('error', () => setMapError(true))
      } catch {
        setMapError(true)
      }
    }

    initMap()

    return () => {
      if (map) map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiData, prefersReducedMotion])

  // Atualizar layer quando toggle muda
  useEffect(() => {
    if (!mapRef.current || !mapReady || !apiData) return
    const map = mapRef.current
    updateLayer(map, apiData.data, layer)
  }, [layer, mapReady, apiData])

  // Loading skeleton
  if (loading) {
    return (
      <div
        data-testid="heatmap-loading"
        className={`animate-pulse rounded-lg bg-muted ${className ?? 'min-h-[300px] h-[60vh]'}`}
        aria-label="Carregando mapa de impacto"
        role="status"
      />
    )
  }

  // Erro na API — fallback textual
  if (apiError) {
    return (
      <div data-testid="heatmap-error" className={className}>
        <HeatmapFallback cells={[]} error="Erro ao carregar dados" />
      </div>
    )
  }

  // Estado empty
  if (apiData && apiData.data.length === 0) {
    return (
      <div
        data-testid="heatmap-empty"
        className={`flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-8 text-center ${className ?? 'min-h-[300px] h-[60vh]'}`}
      >
        <MapPin className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <p className="text-muted-foreground">
          Ainda não há dados suficientes para exibir o mapa de calor neste período.
        </p>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p)
                fetchData(p)
              }}
              disabled={p === period}
              className={`rounded-md border px-4 py-2 text-sm focus:ring-2 focus:ring-ring ${
                p === period
                  ? 'border-primary bg-primary/10 text-primary cursor-default'
                  : 'border-border hover:bg-accent'
              }`}
              style={{ minHeight: '44px' }}
            >
              {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Erro no Mapbox — fallback textual com dados reais
  if (mapError) {
    return (
      <div data-testid="heatmap-error" className={className}>
        <HeatmapFallback
          cells={apiData?.data ?? []}
          error="Mapa temporariamente indisponível"
        />
      </div>
    )
  }

  // Mapa carregado com sucesso
  return (
    <div
      data-testid="heatmap-map"
      className={`relative rounded-lg overflow-hidden border border-border ${className ?? 'min-h-[300px] h-[60vh]'}`}
      aria-label="Mapa de calor de impacto do Prato Solidário por região"
      role="img"
    >
      {/* Container do Mapbox */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Toggle de layers */}
      <div
        className="absolute left-2 top-2 z-10 flex rounded-md border border-border bg-background shadow-sm"
        role="group"
        aria-label="Selecionar camada do mapa"
      >
        {(Object.keys(TOGGLE_LABELS) as LayerMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setLayer(mode)}
            aria-pressed={layer === mode}
            className={`px-3 py-2 text-xs font-medium transition-colors focus:ring-2 focus:ring-ring first:rounded-l-md last:rounded-r-md ${
              layer === mode
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent text-foreground'
            }`}
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            {TOGGLE_LABELS[mode]}
          </button>
        ))}
      </div>

      {/* Legenda */}
      <div className="absolute bottom-6 left-2 z-10 rounded-md border border-border bg-background/90 p-2 text-xs">
        <p className="mb-1 font-medium">Intensidade</p>
        <div className="flex items-center gap-1">
          <div
            className="h-3 w-20 rounded"
            style={{
              background: 'linear-gradient(to right, rgb(0,200,80), rgb(255,210,0), rgb(255,0,0))',
            }}
            aria-hidden="true"
          />
          <span className="text-muted-foreground">Baixa → Alta</span>
        </div>
      </div>

      {/* TASK-20: indicador "Atualizado há X min" + botão manual */}
      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-2">
        {lastUpdated && (
          <span className="text-xs text-muted-foreground bg-background/80 rounded px-1.5 py-0.5">
            {minutesAgo === 0
              ? 'Atualizado agora'
              : `Atualizado há ${minutesAgo} min`}
          </span>
        )}
        <button
          type="button"
          onClick={() => fetchData(period, true)}
          disabled={refreshing || loading}
          aria-label="Atualizar mapa"
          data-testid="heatmap-refresh-button"
          className="rounded-md border border-border bg-background/90 px-2 py-1 text-xs font-medium hover:bg-accent disabled:opacity-50 transition-colors"
          style={{ minHeight: '32px' }}
        >
          {refreshing ? '↻ ...' : '↻ Atualizar'}
        </button>
        {/* Nota de dados stale */}
        {staleLabel && (
          <span className="text-xs text-muted-foreground">
            (Dados de {staleLabel})
          </span>
        )}
      </div>
    </div>
  )
}

// ---- helpers internos ----

function buildGeoJson(cells: HeatmapCell[], mode: LayerMode) {
  // Normalizar intensidade relativa ao máximo de cada modo
  const maxDonations = Math.max(...cells.map((c) => c.donationCount), 1)
  const maxRetrievals = Math.max(...cells.map((c) => c.retrievalCount), 1)

  return {
    type: 'FeatureCollection' as const,
    features: cells.map((cell) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [cell.lng, cell.lat] },
      properties: {
        intensity:
          mode === 'donations'
            ? cell.donationCount / maxDonations
            : mode === 'retrievals'
              ? cell.retrievalCount / maxRetrievals
              : cell.intensity,
      },
    })),
  }
}

function addHeatmapLayer(map: HeatmapMap, cells: HeatmapCell[]) {
  map.addSource('heatmap-data', {
    type: 'geojson',
    data: buildGeoJson(cells, 'both'),
  })

  map.addLayer({
    id: 'heatmap-layer',
    type: 'heatmap',
    source: 'heatmap-data',
    paint: {
      'heatmap-weight': ['get', 'intensity'],
      'heatmap-intensity': 1,
      'heatmap-radius': 30,
      'heatmap-opacity': 0.75,
      'heatmap-color': HEATMAP_COLOR,
    },
  })
}

function updateLayer(map: HeatmapMap, cells: HeatmapCell[], mode: LayerMode) {
  const source = map.getSource('heatmap-data')
  if (source) {
    source.setData(buildGeoJson(cells, mode))
  }
}
