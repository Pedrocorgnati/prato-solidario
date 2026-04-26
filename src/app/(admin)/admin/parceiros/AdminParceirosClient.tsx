'use client'

import * as React from 'react'
import { DataTable } from '@/components/ui/data-table'
import { FilterBar } from '@/components/ui/filter-bar'
import { EmptyState } from '@/components/ui/empty-state'
import { ModerationDialog } from '@/components/admin/ModerationDialog'
import { Button } from '@/components/ui/button'
import { Building2, ShieldCheck, ShieldOff, Ban } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { verifyPartner, revokePartnerVerification, suspendPartner } from '@/actions/admin-partners.actions'
import type { AdminPartnerListItem } from '@/types/admin-gestao'

type PartnerTab = 'ONG' | 'SPONSOR'
type ActionType = 'verify' | 'revoke' | 'suspend'

interface Props {
  initialData: AdminPartnerListItem[]
  total: number
}

export function AdminParceirosClient({ initialData, total }: Props) {
  const toast = useToast()
  const [tab, setTab] = React.useState<PartnerTab>('ONG')
  const [search, setSearch] = React.useState('')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogAction, setDialogAction] = React.useState<ActionType>('verify')
  const [selectedPartner, setSelectedPartner] = React.useState<AdminPartnerListItem | null>(null)
  const [loading, setLoading] = React.useState(false)

  const filtered = initialData
    .filter((p) => p.type === tab)
    .filter((p) =>
      search ? p.name?.toLowerCase().includes(search.toLowerCase()) : true
    )

  const ongCount = initialData.filter((p) => p.type === 'ONG').length
  const sponsorCount = initialData.filter((p) => p.type === 'SPONSOR').length

  function openAction(partner: AdminPartnerListItem, action: ActionType) {
    setSelectedPartner(partner)
    setDialogAction(action)
    setDialogOpen(true)
  }

  async function handleConfirm(motivo: string) {
    if (!selectedPartner) return
    setLoading(true)
    try {
      let result: { success: boolean; error?: string }
      if (dialogAction === 'verify') {
        result = await verifyPartner(selectedPartner.id, motivo)
      } else if (dialogAction === 'revoke') {
        result = await revokePartnerVerification(selectedPartner.id, motivo)
      } else {
        result = await suspendPartner(selectedPartner.id, motivo)
      }

      if (result.success) {
        toast.success(
          dialogAction === 'verify'
            ? 'Parceiro verificado com sucesso'
            : dialogAction === 'revoke'
            ? 'Verificação revogada com sucesso'
            : 'Parceiro suspenso com sucesso'
        )
        setDialogOpen(false)
      } else {
        toast.error(`Erro: ${result.error ?? 'Falha na operação'}`)
      }
    } catch {
      toast.error('Erro inesperado ao executar ação')
    } finally {
      setLoading(false)
    }
  }

  const dialogConfig = {
    verify: { title: 'Verificar ONG', desc: `Verificar ${selectedPartner?.name}?`, variant: 'default' as const, label: 'Verificar' },
    revoke: { title: 'Revogar Verificação', desc: `Revogar verificação de ${selectedPartner?.name}?`, variant: 'destructive' as const, label: 'Revogar' },
    suspend: { title: 'Suspender Parceiro', desc: `Suspender ${selectedPartner?.name}?`, variant: 'destructive' as const, label: 'Suspender' },
  }

  const cfg = dialogConfig[dialogAction]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Parceiros</h1>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar parceiro..."
        filters={[
          { label: `ONGs (${ongCount})`, value: 'ONG' },
          { label: `Patrocinadores (${sponsorCount})`, value: 'SPONSOR' },
        ]}
        activeFilter={tab}
        onFilterChange={(v) => setTab(v as PartnerTab)}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title={tab === 'ONG' ? 'Nenhuma ONG encontrada' : 'Nenhum patrocinador encontrado'}
        />
      ) : (
        <DataTable
          data={filtered}
          columns={[
            { key: 'name', header: 'Nome' },
            ...(tab === 'ONG'
              ? [
                  {
                    key: 'isVerified' as const,
                    header: 'Verificação',
                    render: (row: AdminPartnerListItem) => (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.isVerified
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {row.isVerified ? 'Verificada' : 'Pendente'}
                      </span>
                    ),
                  },
                  {
                    key: 'totalRetiradas' as const,
                    header: 'Retiradas',
                    render: (row: AdminPartnerListItem) => <span>{row.totalRetiradas ?? 0}</span>,
                  },
                ]
              : [
                  {
                    key: 'totalPatrocinado' as const,
                    header: 'Total Patrocinado',
                    render: (row: AdminPartnerListItem) => (
                      <span>
                        {((row.totalPatrocinado ?? 0) / 100).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    ),
                  },
                ]),
            {
              key: 'isActive' as string,
              header: 'Status',
              render: (row) => (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    row.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {row.isActive ? 'Ativo' : 'Suspenso'}
                </span>
              ),
            },
            {
              key: 'actions' as string,
              header: 'Ações',
              render: (row) => (
                <div className="flex gap-1">
                  {tab === 'ONG' && (
                    row.isVerified ? (
                      <Button variant="outline" size="sm" onClick={() => openAction(row, 'revoke')} title="Revogar verificação">
                        <ShieldOff className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => openAction(row, 'verify')} title="Verificar">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </Button>
                    )
                  )}
                  {row.isActive && (
                    <Button variant="outline" size="sm" onClick={() => openAction(row, 'suspend')} title="Suspender">
                      <Ban className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}

      <ModerationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={cfg.title}
        description={cfg.desc}
        confirmLabel={cfg.label}
        variant={cfg.variant}
        onConfirm={handleConfirm}
        isLoading={loading}
        minMotivo={10}
      />
    </div>
  )
}
