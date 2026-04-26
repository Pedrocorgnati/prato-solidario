'use client'

import * as React from 'react'
import { DataTable } from '@/components/ui/data-table'
import { FilterBar } from '@/components/ui/filter-bar'
import { EmptyState } from '@/components/ui/empty-state'
import { ModerationDialog } from '@/components/admin/ModerationDialog'
import { Button } from '@/components/ui/button'
import { Users, ShieldOff, ShieldCheck, Unlock } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { suspendUser, reactivateUser, unblockReceptor } from '@/actions/admin-users.actions'
import type { AdminUserListItem } from '@/types/admin-gestao'

type RoleTab = 'DONOR' | 'RECIPIENT'

interface Props {
  initialDonors: AdminUserListItem[]
  initialReceptors: AdminUserListItem[]
  totalDonors: number
  totalReceptors: number
}

type ActionType = 'suspend' | 'reactivate' | 'unblock'

export function AdminUsuariosClient({
  initialDonors,
  initialReceptors,
  totalDonors,
  totalReceptors,
}: Props) {
  const toast = useToast()
  const [tab, setTab] = React.useState<RoleTab>('DONOR')
  const [search, setSearch] = React.useState('')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogAction, setDialogAction] = React.useState<ActionType>('suspend')
  const [selectedUser, setSelectedUser] = React.useState<AdminUserListItem | null>(null)
  const [loading, setLoading] = React.useState(false)

  const data = tab === 'DONOR' ? initialDonors : initialReceptors
  const filtered = search
    ? data.filter(
        (u) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : data

  function openAction(user: AdminUserListItem, action: ActionType) {
    setSelectedUser(user)
    setDialogAction(action)
    setDialogOpen(true)
  }

  async function handleConfirm(motivo: string) {
    if (!selectedUser) return
    setLoading(true)
    try {
      let result: { success: boolean; error?: string }
      if (dialogAction === 'suspend') {
        result = await suspendUser(selectedUser.id, motivo)
      } else if (dialogAction === 'reactivate') {
        result = await reactivateUser(selectedUser.id, motivo)
      } else {
        result = await unblockReceptor(selectedUser.id, motivo)
      }

      if (result.success) {
        toast.success(
          dialogAction === 'suspend'
            ? 'Usuário suspenso com sucesso'
            : dialogAction === 'reactivate'
            ? 'Usuário reativado com sucesso'
            : 'Receptor desbloqueado com sucesso'
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
    suspend: { title: 'Suspender Usuário', desc: `Suspender ${selectedUser?.name}?`, variant: 'destructive' as const, label: 'Suspender' },
    reactivate: { title: 'Reativar Usuário', desc: `Reativar ${selectedUser?.name}?`, variant: 'default' as const, label: 'Reativar' },
    unblock: { title: 'Desbloquear Receptor', desc: `Desbloquear ${selectedUser?.name ?? 'receptor'}?`, variant: 'default' as const, label: 'Desbloquear' },
  }

  const cfg = dialogConfig[dialogAction]

  return (
    <div data-testid="admin-usuarios-page" className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Gestão de Usuários</h1>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou e-mail..."
        filters={[
          { label: `Doadores (${totalDonors})`, value: 'DONOR' },
          { label: `Receptores (${totalReceptors})`, value: 'RECIPIENT' },
        ]}
        activeFilter={tab}
        onFilterChange={(v) => setTab(v as RoleTab)}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title={tab === 'DONOR' ? 'Nenhum doador encontrado' : 'Nenhum receptor encontrado'}
        />
      ) : (
        <DataTable
          data={filtered}
          columns={[
            { key: 'name', header: 'Nome' },
            { key: 'email', header: 'E-mail' },
            {
              key: 'role',
              header: 'Perfil',
              render: (row) => {
                const labels: Record<string, string> = {
                  DOADOR_PF: 'Pessoa Física',
                  DOADOR_RESTAURANTE: 'Restaurante',
                  RECEPTOR: 'Receptor',
                }
                return <span>{labels[row.role] ?? row.role}</span>
              },
            },
            {
              key: 'isActive',
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
            ...(tab === 'RECIPIENT'
              ? [
                  {
                    key: 'abuseBlocks' as const,
                    header: 'Bloqueios',
                    render: (row: AdminUserListItem) => {
                      const blocks = row.abuseBlocks ?? 0
                      return blocks > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 text-xs font-medium">
                          Bloqueado ({blocks})
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">0</span>
                      )
                    },
                  },
                ]
              : [
                  {
                    key: 'totalDonations' as const,
                    header: 'Doações',
                    render: (row: AdminUserListItem) => (
                      <span>{row.totalDonations ?? 0}</span>
                    ),
                  },
                ]),
            {
              key: 'createdAt',
              header: 'Cadastro',
              render: (row) => (
                <span>{new Date(row.createdAt).toLocaleDateString('pt-BR')}</span>
              ),
            },
            {
              key: 'actions' as string,
              header: 'Ações',
              render: (row) => (
                <div className="flex gap-1">
                  {row.isActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAction(row, 'suspend')}
                      title="Suspender"
                    >
                      <ShieldOff className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAction(row, 'reactivate')}
                      title="Reativar"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {tab === 'RECIPIENT' && (row.abuseBlocks ?? 0) > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAction(row, 'unblock')}
                      title="Desbloquear"
                    >
                      <Unlock className="h-3.5 w-3.5" />
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
