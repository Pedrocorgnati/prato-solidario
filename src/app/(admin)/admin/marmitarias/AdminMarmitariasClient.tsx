'use client'

import * as React from 'react'
import Link from 'next/link'
import { DataTable } from '@/components/ui/data-table'
import { FilterBar } from '@/components/ui/filter-bar'
import { EmptyState } from '@/components/ui/empty-state'
import { ChefHat, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AdminMarmitariaListItem } from '@/types/admin-gestao'

type StatusTab = 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'ALL'

interface Props {
  initialData: AdminMarmitariaListItem[]
  total: number
  pendingCount: number
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: 'Pendente',
  ACTIVE: 'Ativa',
  SUSPENDED: 'Suspensa',
  REJECTED: 'Rejeitada',
  INACTIVE: 'Rejeitada',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_APPROVAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  SUSPENDED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  INACTIVE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function AdminMarmitariasClient({ initialData, total, pendingCount }: Props) {
  const [tab, setTab] = React.useState<StatusTab>('PENDING_APPROVAL')
  const [search, setSearch] = React.useState('')

  const filtered = initialData
    .filter((m) => {
      if (tab === 'ALL') return true
      if (tab === 'REJECTED') return m.status === 'INACTIVE'
      return m.status === tab
    })
    .filter((m) =>
      search
        ? m.tradeName?.toLowerCase().includes(search.toLowerCase()) ||
          m.ownerName?.toLowerCase().includes(search.toLowerCase())
        : true
    )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Marmitarias</h1>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar marmitaria..."
        filters={[
          { label: `Pendentes (${pendingCount})`, value: 'PENDING_APPROVAL' },
          { label: 'Ativas', value: 'ACTIVE' },
          { label: 'Suspensas', value: 'SUSPENDED' },
          { label: 'Rejeitadas', value: 'REJECTED' },
          { label: `Todas (${total})`, value: 'ALL' },
        ]}
        activeFilter={tab}
        onFilterChange={(v) => setTab(v as StatusTab)}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={<ChefHat className="h-8 w-8" />} title="Nenhuma marmitaria encontrada" />
      ) : (
        <DataTable
          data={filtered}
          columns={[
            { key: 'tradeName', header: 'Nome' },
            { key: 'ownerName', header: 'Responsável' },
            { key: 'cnpj', header: 'CNPJ' },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_COLORS[row.status] ?? 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {STATUS_LABELS[row.status] ?? row.status}
                </span>
              ),
            },
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
                <Link href={`/admin/marmitarias/${row.id}`}>
                  <Button variant="outline" size="sm" title="Ver detalhes">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              ),
            },
          ]}
        />
      )}
    </div>
  )
}
