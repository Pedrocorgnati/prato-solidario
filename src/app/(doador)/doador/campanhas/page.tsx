'use client'
export const dynamic = 'force-dynamic'

/**
 * /doador/campanhas — Gestão de campanhas de banner do restaurante doador.
 * Lista campanhas ativas/paradas com saldo de dias disponíveis.
 * @see module-17-banners-system/TASK-3/ST001
 */

import * as React from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Plus, Pause, Play, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  DRAFT:     { label: 'Rascunho', variant: 'secondary' },
  ACTIVE:    { label: 'Ativo',    variant: 'default' },
  PAUSED:    { label: 'Pausado',  variant: 'outline' },
  SCHEDULED: { label: 'Agendado', variant: 'secondary' },
  COMPLETED: { label: 'Concluído', variant: 'secondary' },
  REJECTED:  { label: 'Removido', variant: 'destructive' },
}

const POSITION_LABELS: Record<string, string> = {
  TOP: 'Topo',
  SIDEBAR: 'Lateral',
  INLINE: 'Inline',
}

interface Campaign {
  id: string
  title: string
  status: string
  position: string
  startDate: string | null
  endDate: string | null
  impressions: number
  clicks: number
}

interface CreditBalance {
  daysAvailable: number
  daysUsed?: number
}

export default function DoadorCampanhasPage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([])
  const [balance, setBalance] = React.useState<CreditBalance | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const token = document.cookie
        .split('; ')
        .find((r) => r.startsWith('sb-access-token='))
        ?.split('=')[1]

      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

      const res = await fetch('/api/v1/banners/my-campaigns', { headers })
      if (res.ok) {
        const json = await res.json()
        setCampaigns(json.data ?? [])
        setBalance(json.balance ?? null)
      } else {
        toast.error('Erro ao carregar campanhas.')
      }
    } catch {
      toast.error('Erro ao carregar campanhas.')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [])

  async function togglePause(id: string, isPaused: boolean) {
    setActionLoading(id)
    try {
      const token = document.cookie
        .split('; ')
        .find((r) => r.startsWith('sb-access-token='))
        ?.split('=')[1]

      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`/api/v1/banners/${id}/pause`, {
        method: 'PATCH',
        headers,
      })
      if (res.ok) {
        toast.success(isPaused ? 'Campanha retomada.' : 'Campanha pausada.')
        load()
      } else {
        const d = await res.json()
        toast.error(d.message ?? 'Erro ao atualizar campanha.')
      }
    } catch {
      toast.error('Erro ao atualizar campanha.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Minhas campanhas</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Gerencie seus banners publicitários na plataforma.
          </p>
        </div>
        <Link href="/doador/campanhas/nova">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nova campanha
          </Button>
        </Link>
      </div>

      {/* Saldo */}
      {balance !== null && (
        <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="h-5 w-5 text-[var(--color-primary-raw)]" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Saldo de dias</p>
          </div>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold text-[var(--color-primary-raw)]">
              {balance.daysAvailable}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">disponíveis</p>
            {balance.daysUsed !== undefined && (
              <>
                <p className="text-sm text-[var(--color-text-muted)]">·</p>
                <p className="text-sm text-[var(--color-text-muted)]">{balance.daysUsed} utilizados</p>
              </>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Você ganha dias de banner ao completar doações como restaurante parceiro.
          </p>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border-raw)] gap-3">
          <p className="text-sm text-[var(--color-text-muted)]">Nenhuma campanha criada.</p>
          <Link href="/doador/campanhas/nova">
            <Button size="sm" variant="outline">Criar primeira campanha</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => {
            const statusInfo = STATUS_BADGE[c.status] ?? { label: c.status, variant: 'secondary' as const }
            const canPause = c.status === 'ACTIVE'
            const canResume = c.status === 'PAUSED'
            return (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--color-text-primary)]">{c.title}</p>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {POSITION_LABELS[c.position] ?? c.position}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {c.impressions} impressões · {c.clicks} cliques
                    {c.startDate && ` · Início ${new Date(c.startDate).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  {canPause && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePause(c.id, false)}
                      disabled={actionLoading === c.id}
                      aria-label="Pausar campanha"
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  {canResume && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePause(c.id, true)}
                      disabled={actionLoading === c.id}
                      aria-label="Retomar campanha"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
