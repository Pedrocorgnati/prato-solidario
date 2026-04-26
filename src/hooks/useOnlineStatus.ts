'use client'

import { useEffect, useState } from 'react'

/**
 * Detecta status de conexao de forma SSR-safe.
 * Retorna `true` no servidor (default seguro).
 * No cliente: ouve eventos `online`/`offline` + heartbeat em /api/health enquanto offline
 * para detectar captive portal / wifi conectado sem internet.
 * @see module-7-layout-navigation/TASK-4/ST002 + intake-review/TASK-6/ST001 (CL-295)
 */

const PING_INTERVAL_MS = 8_000
const PING_TIMEOUT_MS = 3_000

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    let timer: ReturnType<typeof setInterval> | null = null

    async function ping() {
      try {
        const controller = new AbortController()
        const t = setTimeout(() => controller.abort(), PING_TIMEOUT_MS)
        const res = await fetch('/api/health', { signal: controller.signal, cache: 'no-store' })
        clearTimeout(t)
        if (res.ok) setIsOnline(true)
      } catch {
        setIsOnline(false)
      }
    }

    function startHeartbeat() {
      if (!timer) timer = setInterval(ping, PING_INTERVAL_MS)
    }

    function stopHeartbeat() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    if (!navigator.onLine) startHeartbeat()

    const onOffline = () => startHeartbeat()
    const onOnline = () => stopHeartbeat()
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
      stopHeartbeat()
    }
  }, [])

  return isOnline
}
