'use client'

import * as React from 'react'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { Package, Bell, BellRing } from 'lucide-react'
import type { AdminSponsoredMealAccumulated } from '@/types/admin-gestao'

interface Props {
  initialData: AdminSponsoredMealAccumulated[]
  totalCreditos: number
}

export function MarmitasAcumuladasClient({ initialData, totalCreditos }: Props) {
  const toast = useToast()
  const [notifyOpen, setNotifyOpen] = React.useState(false)
  const [notifyTarget, setNotifyTarget] = React.useState<AdminSponsoredMealAccumulated | null>(null)
  const [batchOpen, setBatchOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  async function handleNotify() {
    if (!notifyTarget) return
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      const res = await fetch(`${baseUrl}/api/v1/admin/sponsored-meals/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marmitariaIds: [notifyTarget.marmitariaId] }),
      })
      if (res.ok) {
        toast.success(`Notificação enviada para ${notifyTarget.marmitariaNome}`)
        setNotifyOpen(false)
      } else {
        toast.error('Falha ao enviar notificação')
      }
    } catch {
      toast.error('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  async function handleBatchNotify() {
    setLoading(true)
    try {
      const ids = initialData.filter((m) => m.totalCreditos >= 10).map((m) => m.marmitariaId)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      const res = await fetch(`${baseUrl}/api/v1/admin/sponsored-meals/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marmitariaIds: ids }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`${data.notified ?? ids.length} marmitarias notificadas${data.failed ? `. ${data.failed} falharam.` : ''}`)
        setBatchOpen(false)
      } else {
        toast.error('Falha ao enviar notificações em lote')
      }
    } catch {
      toast.error('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  const batchEligible = initialData.filter((m) => m.totalCreditos >= 10).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Marmitas Acumuladas</h1>
        {batchEligible > 0 && (
          <Button variant="default" size="md" onClick={() => setBatchOpen(true)}>
            <BellRing className="h-4 w-4 mr-1" /> Notificar todas ({batchEligible})
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-[var(--color-border-raw)] p-4 bg-[var(--color-surface)]">
        <p className="text-sm text-[var(--color-text-muted)]">Total acumulado</p>
        <p className="text-3xl font-bold text-[var(--color-text-primary)]">
          {totalCreditos} {totalCreditos === 1 ? 'marmita' : 'marmitas'} acumuladas
        </p>
      </div>

      {initialData.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Nenhuma marmita acumulada no momento"
        />
      ) : (
        <DataTable
          data={initialData}
          columns={[
            { key: 'marmitariaNome', header: 'Marmitaria' },
            {
              key: 'totalCreditos',
              header: 'Créditos',
              render: (row) => <span className="font-semibold">{row.totalCreditos}</span>,
            },
            {
              key: 'creditoMaisAntigoEm',
              header: 'Crédito mais antigo',
              render: (row) => <span>{new Date(row.creditoMaisAntigoEm).toLocaleDateString('pt-BR')}</span>,
            },
            {
              key: 'diasAcumulados',
              header: 'Dias acumulados',
              render: (row) => (
                <span className={row.diasAcumulados > 60 ? 'text-red-600 font-semibold' : ''}>
                  {row.diasAcumulados} dias
                </span>
              ),
            },
            {
              key: 'actions' as string,
              header: 'Ações',
              render: (row) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNotifyTarget(row)
                    setNotifyOpen(true)
                  }}
                  title="Notificar marmitaria"
                >
                  <Bell className="h-3.5 w-3.5" />
                </Button>
              ),
            },
          ]}
        />
      )}

      <ConfirmDialog
        open={notifyOpen}
        onOpenChange={setNotifyOpen}
        title="Notificar Marmitaria"
        description={`Enviar notificação para "${notifyTarget?.marmitariaNome}" sobre ${notifyTarget?.totalCreditos} créditos acumulados?`}
        confirmLabel="Enviar Notificação"
        onConfirm={handleNotify}
        isLoading={loading}
      />

      <ConfirmDialog
        open={batchOpen}
        onOpenChange={setBatchOpen}
        title="Notificação em Lote"
        description={`Enviar notificação para ${batchEligible} marmitarias com 10+ créditos acumulados?`}
        confirmLabel="Notificar Todas"
        onConfirm={handleBatchNotify}
        isLoading={loading}
      />
    </div>
  )
}
