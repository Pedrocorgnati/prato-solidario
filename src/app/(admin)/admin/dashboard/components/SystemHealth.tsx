'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'

type ServiceStatus = 'ok' | 'degraded' | 'error' | 'not_tracked'

interface ServiceCheck {
  status: ServiceStatus
  detail: string
  latencyMs?: number
}

interface HealthData {
  db: ServiceCheck
  supabaseAuth: ServiceCheck
  mercadoPagoWebhook: ServiceCheck
  expoPush: ServiceCheck
}

const POLL_INTERVAL_MS = 60_000

const SERVICE_LABELS: Record<keyof HealthData, string> = {
  db: 'PostgreSQL',
  supabaseAuth: 'Supabase Auth',
  mercadoPagoWebhook: 'Mercado Pago',
  expoPush: 'Expo Push',
}

const STATUS_CONFIG: Record<ServiceStatus, { dot: string; label: string }> = {
  ok: { dot: 'bg-emerald-500', label: 'OK' },
  degraded: { dot: 'bg-amber-500', label: 'Degradado' },
  error: { dot: 'bg-red-500', label: 'Falha' },
  not_tracked: { dot: 'bg-gray-400', label: 'Sem monitoramento' },
}

export function SystemHealth() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch('/api/v1/admin/health')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: HealthData = await res.json()
      setHealth(data)
      setError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Falha ao verificar saúde: ${msg}`)
    } finally {
      if (isInitial) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth(true)
    const interval = setInterval(() => fetchHealth(false), POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchHealth])

  return (
    <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          Saúde do Sistema
        </h2>
        <RefreshCw
          className="h-4 w-4 text-[var(--color-text-muted)] animate-spin"
          style={{ animationDuration: '3s' }}
          aria-label="Atualizando automaticamente"
        />
      </div>

      <div aria-live="polite" className="space-y-2">
        {isLoading && (
          <div className="space-y-2" aria-busy="true" aria-label="Carregando saúde do sistema...">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-3">
                <div className="h-3 w-3 animate-pulse rounded-full bg-[var(--color-muted-raw)]" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-24 animate-pulse rounded bg-[var(--color-muted-raw)]" />
                  <div className="h-3 w-40 animate-pulse rounded bg-[var(--color-muted-raw)]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && error && !health && (
          <p className="py-4 text-center text-sm text-[var(--color-danger)]">{error}</p>
        )}

        {!isLoading && health && (
          <>
            {error && (
              <p className="mb-2 text-xs text-[var(--color-warning)]">{error}</p>
            )}
            {(Object.keys(SERVICE_LABELS) as (keyof HealthData)[]).map((key) => {
              const check = health[key]
              const config = STATUS_CONFIG[check.status]
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-md border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-3"
                >
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full ${config.dot}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {SERVICE_LABELS[key]}
                      </p>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {config.label}
                      </span>
                    </div>
                    <p className="truncate text-xs text-[var(--color-text-muted)]">
                      {check.detail}
                    </p>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
