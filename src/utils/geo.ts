import type { GeoPoint } from '@/types/common'

/**
 * Utilitários de geolocalização: Haversine, raio, formatação de distância.
 * @see module-2-shared-foundations/TASK-3/ST004
 */

const EARTH_RADIUS_KM = 6371

/** Converte graus para radianos */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine.
 * Retorna a distância em quilômetros.
 *
 * @example
 * // SP → RJ ≈ 360km
 * calculateDistance({ lat: -23.5505, lng: -46.6333 }, { lat: -22.9068, lng: -43.1729 })
 */
export function calculateDistance(p1: GeoPoint, p2: GeoPoint): number {
  const dLat = toRad(p2.lat - p1.lat)
  const dLng = toRad(p2.lng - p1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) *
      Math.cos(toRad(p2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

/**
 * Verifica se um ponto está dentro de um raio em km de um centro.
 */
export function isWithinRadius(
  center: GeoPoint,
  point: GeoPoint,
  radiusKm: number
): boolean {
  return calculateDistance(center, point) <= radiusKm
}

/**
 * Formata distância em km para string legível em pt-BR.
 * - Menos de 1km: mostra em metros ('500m')
 * - 1km ou mais: mostra em km com 1 decimal ('2,3 km')
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000)
    return `${meters}m`
  }
  const formatted = km.toFixed(1).replace('.', ',')
  return `${formatted} km`
}

/**
 * Extrai GeoPoint de coordenadas no formato [lat, lng] ou {lat, lng}.
 */
export function toGeoPoint(lat: number, lng: number): GeoPoint {
  return { lat, lng }
}
