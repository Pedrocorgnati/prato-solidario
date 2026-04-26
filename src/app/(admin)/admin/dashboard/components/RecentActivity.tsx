'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, Ban, AlertTriangle, FileText, RefreshCw } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { formatRelative } from '@/utils/date'

interface ActivityItem {
  id: string
  action: string
  entityType: string
  entityId: string
  userId: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

const POLL_INTERVAL_MS = 30_000

function getActionIcon(action: string) {
  const upper = action.toUpperCase()
  if (upper === 'APPROVE') return <CheckCircle className="h-5 w-5 text-emerald-600" />
  if (upper === 'REJECT' || upper === 'SUSPEND') return <Ban className="h-5 w-5 text-red-500" />
  if (upper === 'WARN') return <AlertTriangle className="h-5 w-5 text-amber-500" />
  return <FileText className="h-5 w-5 text-[var(--color-text-muted)]" />
}

function describeAction(entityType: string, action: string): string {
  const entity = entityType.toLowerCase().replace(/_/g, ' ')
  const verb = action.toLowerCase().replace(/_/g, ' ')
  return `${verb} — ${entity}`
}

export function RecentActivity() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivity = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch('/api/v1/admin/activity?limit=20')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setItems(data.items ?? [])
      setError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Falha ao carregar atividade: ${msg}`)
      // Mantém dados anteriores visíveis
    } finally {
      if (isInitial) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActivity(true)
    const interval = setInterval(() => fetchActivity(false), POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchActivity])

  return (
    <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
          Atividade Recente
        </h2>
        <RefreshCw
          className="h-4 w-4 text-[var(--color-text-muted)] animate-spin"
          style={{ animationDuration: '3s' }}
          aria-label="Atualizando automaticamente"
        />
      </div>

      {isLoading && (
        <div className="space-y-3" aria-busy="true" aria-label="Carregando atividade...">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="h-5 w-5 animate-pulse rounded-full bg-[var(--color-muted-raw)]" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-muted-raw)]" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--color-muted-raw)]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && items.length === 0 && (
        <p className="py-4 text-center text-sm text-[var(--color-danger)]">{error}</p>
      )}

      {!isLoading && !error && items.length === 0 && (
        <EmptyState title="Nenhuma atividade recente" />
      )}

      {!isLoading && items.length > 0 && (
        <>
          {error && (
            <p className="mb-2 text-xs text-[var(--color-warning)]">{error}</p>
          )}
          <ul className="max-h-[400px] space-y-1 overflow-y-auto" role="list">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-[var(--color-muted-raw)]"
              >
                <span className="mt-0.5 shrink-0">{getActionIcon(item.action)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize text-[var(--color-text-primary)]">
                    {describeAction(item.entityType, item.action)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {formatRelative(item.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
