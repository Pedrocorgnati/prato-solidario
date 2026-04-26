'use client'

import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

/**
 * Banner de modo offline — aparece automaticamente quando o dispositivo perde conexão.
 * SSR-safe: renderiza null no servidor para evitar hydration mismatch.
 * @see module-7-layout-navigation/TASK-4/ST003
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-[var(--color-warning)] text-white py-2 px-4 text-center text-sm font-medium"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Você está sem conexão. Algumas funcionalidades podem não estar disponíveis.</span>
    </div>
  )
}
