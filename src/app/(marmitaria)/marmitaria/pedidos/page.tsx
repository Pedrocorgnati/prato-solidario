'use client'
export const dynamic = 'force-dynamic'

/**
 * Página de pedidos da marmitaria — consome dados reais via /api/v1/marmitarias/meals
 * Substituiu EmptyState placeholder (intake-review TASK-9 ST003)
 */

import * as React from 'react'
import { Utensils, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'

const POLL_INTERVAL_MS = 30_000

interface MealItem {
  id: string
  code: string
  quantity: number
  status: string
  createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponível',
  RESERVED: 'Reservado',
  DELIVERED: 'Entregue',
  PENDING: 'Pendente',
}

const STATUS_VARIANT: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
  AVAILABLE: 'secondary',
  RESERVED: 'default',
  DELIVERED: 'outline',
  PENDING: 'secondary',
}

export default function PedidosPage() {
  const [meals, setMeals] = React.useState<MealItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  async function fetchMeals() {
    try {
      const res = await fetch('/api/v1/marmitarias/meals?status=AVAILABLE,RESERVED', {
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        const items = (data.meals ?? data.data ?? []) as MealItem[]
        setMeals(items)
      }
    } catch {
      // Silencioso
    } finally {
      setLoading(false)
    }
  }

  // Busca inicial + polling 30s
  React.useEffect(() => {
    fetchMeals()
    const interval = setInterval(fetchMeals, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  async function handleAction(mealId: string, action: 'confirm' | 'reject') {
    setActionLoading(mealId)
    try {
      const res = await fetch(`/api/v1/marmitarias/meals/${mealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        toast.success(action === 'confirm' ? 'Pedido confirmado.' : 'Pedido rejeitado.')
        await fetchMeals()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.message ?? 'Erro ao processar pedido.')
      }
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setActionLoading(null)
    }
  }

  const tableData = meals.map((m) => ({
    id: m.id,
    codigo: m.code ?? '—',
    quantidade: m.quantity ?? '—',
    solicitadoEm: new Date(m.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    status: (
      <Badge variant={STATUS_VARIANT[m.status] ?? 'outline'}>
        {STATUS_LABELS[m.status] ?? m.status}
      </Badge>
    ),
    acoes: (
      <div className="flex gap-2">
        <button
          type="button"
          disabled={actionLoading === m.id || m.status === 'DELIVERED'}
          onClick={() => handleAction(m.id, 'confirm')}
          className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-40 transition-colors"
        >
          Confirmar
        </button>
        <button
          type="button"
          disabled={actionLoading === m.id || m.status === 'DELIVERED'}
          onClick={() => handleAction(m.id, 'reject')}
          className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-40 transition-colors"
        >
          Rejeitar
        </button>
      </div>
    ),
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Pedidos</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Marmitas solicitadas por patrocinadores aguardando preparo.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchMeals}
          className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="Atualizar pedidos"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div data-testid="skeleton-table">
          <LoadingSkeleton variant="card" count={4} />
        </div>
      ) : meals.length === 0 ? (
        <EmptyState
          icon={<Utensils className="h-8 w-8" />}
          title="Nenhum pedido pendente no momento"
          description="Os pedidos aparecerão aqui assim que chegarem. Atualizado automaticamente."
        />
      ) : (
        <DataTable
          data={tableData}
          columns={[
            { key: 'codigo', header: 'Código' },
            { key: 'quantidade', header: 'Quantidade' },
            { key: 'solicitadoEm', header: 'Solicitado em' },
            { key: 'status', header: 'Status' },
            { key: 'acoes', header: 'Ações' },
          ]}
        />
      )}
    </div>
  )
}
