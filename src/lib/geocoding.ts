/**
 * Geocoding server-side com fallback ViaCEP.
 * NUNCA exportar MAPBOX_ACCESS_TOKEN com prefixo NEXT_PUBLIC_.
 * @see module-8-doacao-form/TASK-1/ST003
 */

import type { GeoPoint, AddressBR } from '@/types/common'

// ---------------------------------------------------------------------------
// Erros customizados
// ---------------------------------------------------------------------------

export class GeocodingError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message)
    this.name = 'GeocodingError'
  }
}

// ---------------------------------------------------------------------------
// Geocoding via Mapbox (primário)
// ---------------------------------------------------------------------------

async function geocodeViaMapbox(address: string): Promise<GeoPoint | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN
  if (!token) return null

  const encoded = encodeURIComponent(address)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=BR&limit=1&language=pt&access_token=${token}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!res.ok) {
      console.warn(`[geocoding] Mapbox retornou ${res.status}`)
      return null
    }

    const data = await res.json()
    const center = data.features?.[0]?.center
    if (!center) return null

    const [lng, lat] = center as [number, number]
    return { lat, lng }
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('[geocoding] Mapbox timeout (>5s)')
    } else {
      console.warn('[geocoding] Mapbox error:', err)
    }
    return null
  }
}

// ---------------------------------------------------------------------------
// Geocoding via ViaCEP (fallback — retorna centroid aproximado do CEP)
// ---------------------------------------------------------------------------

async function geocodeViaCep(cep: string): Promise<GeoPoint | null> {
  const cleaned = cep.replace(/\D/g, '')
  if (cleaned.length !== 8) return null

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) return null
    const data = await res.json()
    if (data.erro) return null

    // ViaCEP não retorna coordenadas diretamente — usar Nominatim como fallback GIS
    const cidade = encodeURIComponent(`${data.bairro}, ${data.localidade}, ${data.uf}, Brasil`)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${cidade}&format=json&limit=1&countrycodes=br`

    const nominatimRes = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'PratoSolidario/1.0' },
    })
    if (!nominatimRes.ok) return null

    const results = await nominatimRes.json()
    if (!results.length) return null

    return {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
    }
  } catch (err) {
    clearTimeout(timeoutId)
    console.warn('[geocoding] ViaCEP/Nominatim error:', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Função principal: geocodeAddress com fallback completo
// ---------------------------------------------------------------------------

/**
 * Geocodifica um endereço brasileiro server-side.
 * Tenta Mapbox → ViaCEP+Nominatim → lança GeocodingError se ambos falharem.
 *
 * @param address - Endereço completo ou apenas CEP como AddressBR
 * @throws GeocodingError com código GEO_001 se todos os serviços falharem
 */
export async function geocodeAddress(address: AddressBR): Promise<GeoPoint> {
  const fullAddress = [
    address.logradouro,
    address.numero,
    address.bairro,
    address.cidade,
    address.estado,
    'Brasil',
  ]
    .filter(Boolean)
    .join(', ')

  // Tentativa 1: Mapbox
  const mapboxResult = await geocodeViaMapbox(fullAddress)
  if (mapboxResult) return mapboxResult

  // Tentativa 2: ViaCEP + Nominatim (fallback quando Mapbox indisponível)
  console.warn('[geocoding] Mapbox indisponível, tentando ViaCEP fallback')
  const viaCepResult = await geocodeViaCep(address.cep)
  if (viaCepResult) return viaCepResult

  // Ambos falharam
  throw new GeocodingError(
    'GEO_001',
    'Endereço não pôde ser localizado. Verifique o CEP e tente novamente.'
  )
}
