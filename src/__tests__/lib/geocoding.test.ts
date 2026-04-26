/**
 * Testes unitários de geocodeAddress.
 * A função recebe AddressBR (não string) e retorna GeoPoint { lat, lng }.
 * Quando todos os serviços falham, lança GeocodingError com código GEO_001.
 * @see src/lib/geocoding.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { geocodeAddress, GeocodingError } from '@/lib/geocoding'
import type { AddressBR } from '@/types/common'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const baseAddress: AddressBR = {
  cep: '01310-100',
  logradouro: 'Avenida Paulista',
  numero: '1578',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  estado: 'SP',
}

describe('geocodeAddress', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch')
    // Definir token para que Mapbox seja tentado
    process.env.MAPBOX_ACCESS_TOKEN = 'test-token'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.MAPBOX_ACCESS_TOKEN
  })

  it('retorna { lat, lng } para endereço válido (Mapbox ok)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [{ center: [-46.633309, -23.550520] }],
      }),
    } as Response)

    const result = await geocodeAddress(baseAddress)
    expect(result).toEqual({ lat: -23.550520, lng: -46.633309 })
  })

  it('lança GeocodingError GEO_001 quando fetch falha com erro de rede', async () => {
    // Mapbox falha com erro de rede
    vi.mocked(fetch).mockRejectedValue(new Error('Network timeout'))

    await expect(geocodeAddress(baseAddress)).rejects.toThrow(GeocodingError)
    await expect(geocodeAddress(baseAddress)).rejects.toMatchObject({ code: 'GEO_001' })
  })

  it('lança GeocodingError GEO_001 quando Mapbox retorna features vazia', async () => {
    // Mapbox retorna lista vazia → fallback ViaCEP também falha
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ features: [] }),
      } as Response)
      // ViaCEP falha
      .mockRejectedValueOnce(new Error('Network timeout'))

    await expect(geocodeAddress({ ...baseAddress, cep: '99999-999' })).rejects.toThrow(GeocodingError)
  })

  it('lança GeocodingError GEO_001 quando resposta Mapbox não é ok (401)', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response)
      // ViaCEP também falha
      .mockRejectedValueOnce(new Error('Network timeout'))

    await expect(geocodeAddress(baseAddress)).rejects.toThrow(GeocodingError)
  })

  it('usa fallback ViaCEP+Nominatim quando Mapbox não tem token', async () => {
    delete process.env.MAPBOX_ACCESS_TOKEN

    // ViaCEP retorna dados do bairro
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bairro: 'Bela Vista',
          localidade: 'São Paulo',
          uf: 'SP',
          erro: false,
        }),
      } as Response)
      // Nominatim retorna coordenadas
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([{ lat: '-23.5505', lon: '-46.6333' }]),
      } as Response)

    const result = await geocodeAddress(baseAddress)
    expect(result).toEqual({ lat: -23.5505, lng: -46.6333 })
  })
})
