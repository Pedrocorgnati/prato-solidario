'use client'

/**
 * OfflineBanner + RetryToast — feedback visual de rede instavel.
 * @see intake-review/TASK-6/ST002 — CL-295
 */

import { useEffect, useRef, useState } from 'react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()
  const wasOffline = useRef(false)
  const [showRecovery, setShowRecovery] = useState(false)

  useEffect(() => {
    if (!online) {
      wasOffline.current = true
      return
    }
    if (wasOffline.current && online) {
      setShowRecovery(true)
      wasOffline.current = false
      const t = setTimeout(() => setShowRecovery(false), 3000)
      return () => clearTimeout(t)
    }
  }, [online])

  if (!online) {
    return (
      <div
        role="status"
        aria-live="assertive"
        className="fixed inset-x-0 top-0 z-50 bg-yellow-600 px-4 py-2 text-center text-sm text-white"
      >
        Sem conexao. Tentando reconectar...
      </div>
    )
  }

  if (showRecovery) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-0 top-0 z-50 bg-green-600 px-4 py-2 text-center text-sm text-white"
      >
        Conexao restaurada.
      </div>
    )
  }

  return null
}
