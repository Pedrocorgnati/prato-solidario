'use client'

/**
 * AdminBannersTable — DataTable paginada de campanhas de banner para o admin.
 * Filtros: status, tipo, posição. Ações: ativar, pausar, excluir.
 * @see module-17-banners-system/TASK-1/ST001
 */

import * as React from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { Play, Pause, Trash2, Edit } from 'lucide-react'

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT:     { label: 'Rascunho',  variant: 'secondary' },
  ACTIVE:    { label: 'Ativo',     variant: 'default' },
  PAUSED:    { label: 'Pausado',   variant: 'outline' },
  SCHEDULED: { label: 'Agendado', variant: 'secondary' },
  COMPLETED: { label: 'Concluído', variant: 'secondary' },
  REJECTED:  { label: 'Removido', variant: 'destructive' },
}

const TYPE_LABELS: Record<string, string> = {
  PAID: 'Pago',
  FREE_RESTAURANT: 'Crédito',
  PERMUTA: 'Permuta',
}

const POSITION_LABELS: Record<string, string> = {
  TOP: 'Topo',
  SIDEBAR: 'Lateral',
  INLINE: 'Inline',
}

interface Campaign {
  id: string
  title: string
  type: string
  status: string
  position: string
  priority: number
  startDate: string | null
  endDate: string | null
  impressions: number
  clicks: number
  advertiser: { name: string; email: string } | null
}

export function AdminBannersTable() {
  const router = useRouter()
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null)
  const [deleteReason, setDeleteReason] = React.useState('')
  const [deleting, setDeleting] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/admin/banners?page=${page}&limit=10`)
      const data = await res.json()
      setCampaigns(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch {
      toast.error('Erro ao carregar campanhas.')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [page])

  async function activate(id: string) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/v1/admin/banners/${id}/activate`, { method: 'PATCH' })
      if (res.ok) { toast.success('Campanha ativada.'); load() }
      else { const d = await res.json(); toast.error(d.message ?? 'Erro ao ativar.') }
    } finally {
      setActionLoading(null)
    }
  }

  async function pause(id: string) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/v1/admin/banners/${id}/pause`, { method: 'PATCH' })
      if (res.ok) { toast.success('Campanha pausada.'); load() }
      else { const d = await res.json(); toast.error(d.message ?? 'Erro ao pausar.') }
    } finally {
      setActionLoading(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleteReason.trim().length < 10) {
      toast.error('Motivo deve ter no mínimo 10 caracteres.')
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`/api/v1/admin/banners/${deleteTarget}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason }),
      })
      if (res.status === 204) {
        toast.success('Campanha removida.')
        setDeleteTarget(null)
        setDeleteReason('')
        load()
      } else {
        const d = await res.json()
        toast.error(d.message ?? 'Erro ao remover.')
      }
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border-raw)]">
        <p className="text-sm text-[var(--color-text-muted)]">Nenhuma campanha cadastrada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border-raw)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border-raw)] bg-[var(--color-surface)]">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Título</th>
              <th className="px-4 py-3 text-left font-medium">Tipo</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Posição</th>
              <th className="px-4 py-3 text-left font-medium">Prioridade</th>
              <th className="px-4 py-3 text-left font-medium">Cliques</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const statusInfo = STATUS_BADGE[c.status] ?? { label: c.status, variant: 'secondary' as const }
              return (
                <tr key={c.id} className="border-b border-[var(--color-border-raw)] last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-text-primary)]">{c.title}</p>
                    {c.advertiser && (
                      <p className="text-xs text-[var(--color-text-muted)]">{c.advertiser.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {TYPE_LABELS[c.type] ?? c.type}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {POSITION_LABELS[c.position] ?? c.position}
                  </td>
                  <td className="px-4 py-3 text-center">{c.priority}</td>
                  <td className="px-4 py-3 text-center">{c.clicks}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {c.status !== 'ACTIVE' && c.status !== 'REJECTED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => activate(c.id)}
                          disabled={actionLoading === c.id}
                          title="Ativar"
                          aria-label="Ativar campanha"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {c.status === 'ACTIVE' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => pause(c.id)}
                          disabled={actionLoading === c.id}
                          title="Pausar"
                          aria-label="Pausar campanha"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      {c.status !== 'REJECTED' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/banners/${c.id}`)}
                            title="Editar"
                            aria-label="Editar campanha"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(c.id)}
                            title="Remover"
                            aria-label="Remover campanha"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(total / 10)}
        onPageChange={setPage}
      />

      {/* Dialog de exclusão */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteReason('') } }}
        title="Remover campanha?"
        description={
          <div className="space-y-2">
            <p>Esta ação remove a campanha da rotação imediatamente.</p>
            <Input
              placeholder="Motivo da remoção (mínimo 10 caracteres)"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
          </div>
        }
        confirmLabel="Confirmar remoção"
        variant="destructive"
        onConfirm={confirmDelete}
        isLoading={deleting}
      />
    </div>
  )
}
