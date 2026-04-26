/**
 * GeocodingService — Mapbox Geocoding API v5 (server-side only).
 *
 * ATENÇÃO: Usar apenas em Server Components, API Routes e Server Actions.
 * A chave MAPBOX_ACCESS_TOKEN é server-side — nunca expor ao cliente.
 */

import { env } from '@/lib/env'

export interface GeocodingResult {
  lat: number
  lng: number
  placeName?: string
}

interface MapboxFeature {
  center: [number, number]
  place_name: string
}

interface MapboxGeocodingResponse {
  features: MapboxFeature[]
}

/**
 * Geocodifica um endereço usando a Mapbox Geocoding API v5.
 * Retorna coordenadas ou null em caso de falha (endereço não encontrado,
 * chave ausente, erro de rede, etc.).
 *
 * @param address - Endereço completo a ser geocodificado
 * @returns GeocodingResult com lat/lng e nome do local, ou null
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!address.trim()) return null

  const token = env.MAPBOX_ACCESS_TOKEN
  if (!token) {
    console.warn('[GeocodingService] MAPBOX_ACCESS_TOKEN não configurado — geocoding indisponível.')
    return null
  }

  const encoded = encodeURIComponent(address)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1&language=pt&country=BR`

  try {
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // cache por 24h — endereços raramente mudam
    })

    if (!response.ok) {
      console.error(`[GeocodingService] Mapbox API error: ${response.status}`)
      return null
    }

    const data: MapboxGeocodingResponse = await response.json()

    if (!data.features || data.features.length === 0) {
      return null
    }

    const [lng, lat] = data.features[0].center
    const placeName = data.features[0].place_name

    return { lat, lng, placeName }
  } catch (error) {
    console.error('[GeocodingService] Erro ao geocodificar endereço:', error)
    return null
  }
}
