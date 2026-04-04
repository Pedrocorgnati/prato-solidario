export interface ViaCEPResult {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export interface GeoPoint {
  lat: number
  lng: number
}

export class GeoService {
  async resolveAddress(cep: string): Promise<ViaCEPResult | null> {
    const cleaned = cep.replace(/\D/g, '')
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!res.ok) return null
      const data: ViaCEPResult = await res.json()
      if (data.erro) return null
      return data
    } catch {
      // ViaCEP indisponível — fallback: campos manuais
      return null
    }
  }

  async geocode(address: string): Promise<GeoPoint | null> {
    const token = process.env.MAPBOX_ACCESS_TOKEN
    if (!token) return null

    const encoded = encodeURIComponent(address)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?country=BR&limit=1&access_token=${token}`

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        const res = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)
        if (!res.ok) throw new Error(`Mapbox ${res.status}`)
        const data = await res.json()
        const [lng, lat] = data.features?.[0]?.center ?? []
        if (lat == null || lng == null) return null
        return { lat, lng }
      } catch {
        if (attempt === 0) await new Promise((r) => setTimeout(r, 2000))
        else return null
      }
    }
    return null
  }
}

export const geoService = new GeoService()
