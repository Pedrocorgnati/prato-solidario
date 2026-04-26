'use client'

/**
 * NotificationBell — sino de alertas administrativos com badge de contagem.
 * Polling a cada 60s via setInterval. Dropdown lista alertas recentes.
 * @see intake-review/TASK-8/ST003
 */

import * as React from 'react'
import { Bell, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface AdminAlertItem {
  id: string
  type: string
  message: string
  read: boolean
  createdAt: string
  user?: { id: string; name: string; email: string } | null
}

const POLL_INTERVAL_MS = 60_000

/** Formata tempo relativo simplificado */
function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return `há ${diffMin}min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `há ${diffH}h`
  return `há ${Math.floor(diffH / 24)}d`
}

export function NotificationBell() {
  const [alerts, setAlerts] = React.useState<AdminAlertItem[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [open, setOpen] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  async function fetchAlerts() {
    try {
      const res = await fetch('/api/v1/admin/alerts?unreadOnly=true&limit=5', {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setAlerts(data.alerts ?? [])
      setUnreadCount(data.unreadCount ?? 0)
      setError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Falha ao carregar alertas: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Busca inicial + polling 60s
  React.useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  // Fechar dropdown ao clicar fora
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleMarkRead(id: string) {
    try {
      await fetch(`/api/v1/admin/alerts/${id}/read`, { method: 'PATCH' })
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // Silencioso
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label="Notificações administrativas"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-md hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            data-testid="alert-badge"
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] shadow-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-raw)]">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Alertas {unreadCount > 0 && `(${unreadCount})`}
            </span>
            <Link
              href="/admin/incidentes"
              className="text-xs text-[var(--color-primary-raw)] hover:underline"
              onClick={() => setOpen(false)}
            >
              Ver todos
            </Link>
          </div>

          {isLoading ? (
            <div
              className="px-4 py-6 text-center text-sm text-[var(--color-text-muted)]"
              aria-busy="true"
            >
              Carregando alertas...
            </div>
          ) : error ? (
            <div
              role="alert"
              className="px-4 py-4 text-center text-xs text-[var(--color-danger)]"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true)
                  void fetchAlerts()
                }}
                className="mt-2 underline hover:no-underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : alerts.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
              Nenhum alerta pendente
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-[var(--color-border-raw)]">
              {alerts.map((alert) => (
                <li key={alert.id} className="px-4 py-3 hover:bg-[var(--color-surface)] transition-colors">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--color-text-primary)] line-clamp-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          {timeAgo(alert.createdAt)}
                        </span>
                        {!alert.read && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(alert.id)}
                            className="text-[10px] text-[var(--color-primary-raw)] hover:underline"
                          >
                            Marcar lido
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
