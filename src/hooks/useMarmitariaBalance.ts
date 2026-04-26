'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface MarmitariaBalance {
  available: number
  pending: number
  delivered: number
  totalReceivedBrl: number
}

interface UseMarmitariaBalanceReturn {
  data: MarmitariaBalance | null
  isLoading: boolean
  error: string | null
  lastUpdatedAt: Date | null
  refresh: () => Promise<void>
}

export function useMarmitariaBalance(pollingIntervalMs = 10000): UseMarmitariaBalanceReturn {
  const [data, setData] = useState<MarmitariaBalance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/marmitarias/balance')
      if (!res.ok) throw new Error('Falha ao carregar saldo')
      const json = await res.json()
      setData(json)
      setLastUpdatedAt(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    await fetchBalance()
  }, [fetchBalance])

  useEffect(() => {
    fetchBalance()

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(fetchBalance, pollingIntervalMs)
    }

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchBalance()
        startPolling()
      } else {
        stopPolling()
      }
    }

    startPolling()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchBalance, pollingIntervalMs])

  return { data, isLoading, error, lastUpdatedAt, refresh }
}
