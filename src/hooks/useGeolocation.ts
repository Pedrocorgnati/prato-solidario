'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { GeoPoint } from '@/types/common'

interface UseGeolocationReturn {
  position: GeoPoint | null
  error: string | null
  loading: boolean
  refetch: () => void
}

function mapError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Permissao de localizacao negada pelo usuario.'
    case err.POSITION_UNAVAILABLE:
      return 'Informacao de localizacao indisponivel.'
    case err.TIMEOUT:
      return 'Tempo limite para obter localizacao esgotado.'
    default:
      return 'Erro desconhecido ao obter localizacao.'
  }
}

/**
 * Obtem a localizacao do dispositivo via Geolocation API.
 * SSR-safe — retorna null no servidor. Mensagens de erro em pt-BR.
 */
export function useGeolocation(timeout = 10_000): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPoint | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const mountedRef = useRef(true)

  const fetchPosition = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation API nao suportada neste navegador.')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mountedRef.current) return
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        if (!mountedRef.current) return
        setError(mapError(err))
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout,
        maximumAge: 0,
      },
    )
  }, [timeout])

  useEffect(() => {
    mountedRef.current = true
    fetchPosition()

    return () => {
      mountedRef.current = false
    }
  }, [fetchPosition])

  return { position, error, loading, refetch: fetchPosition }
}
