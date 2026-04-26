'use client'

import * as React from 'react'
import Link from 'next/link'
import { DataTable } from '@/components/ui/data-table'
import { FilterBar } from '@/components/ui/filter-bar'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Eye } from 'lucide-react'
import type { AdminIncidentListItem } from '@/types/admin-gestao'

type StatusFilter = 'ALL' | 'OPEN' | 'INVESTIGATING' | 'RESOLVED'

interface Props {
  initialData: AdminIncidentListItem[]
  total: number
  openCount: number
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto',
  INVESTIGATING: 'Em investigação',
  RESOLVED: 'Resolvido',
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  INVESTIGATING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

const TYPE_COLORS: Record<string, string> = {
  ABUSE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  FRAUD: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  QUALITY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  NO_SHOW: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
}

export function AdminIncidentesClient({ initialData, openCount }: Props) {
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL')
  const [search, setSearch] = React.useState('')

  const filtered = initialData
    .filter((i) => (statusFilter === 'ALL' ? true : i.status === statusFilter))
    .filter((i) =>
      search ? i.id.toLowerCase().includes(search.toLowerCase()) : true
    )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        Incidentes {openCount > 0 && <span className="text-base font-normal text-[var(--color-text-muted)]">({openCount} abertos)</span>}
      </h1>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por ID..."
        filters={[
          { label: 'Todos', value: 'ALL' },
          { label: 'Abertos', value: 'OPEN' },
          { label: 'Em investigação', value: 'INVESTIGATING' },
          { label: 'Resolvidos', value: 'RESOLVED' },
        ]}
        activeFilter={statusFilter}
        onFilterChange={(v) => setStatusFilter(v as StatusFilter)}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title="Nenhum incidente encontrado com os filtros selecionados"
        />
      ) : (
        <DataTable
          data={filtered}
          columns={[
            { key: 'id', header: 'ID', render: (row) => <span className="font-mono text-xs">{row.id.slice(0, 8)}</span> },
            {
              key: 'type',
              header: 'Tipo',
              render: (row) => (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[row.type] ?? 'bg-gray-100 text-gray-800'}`}>
                  {row.type}
                </span>
              ),
            },
            {
              key: 'severity',
              header: 'Severidade',
              render: (row) => <span>{row.severity === 'HIGH' ? 'Alta' : row.severity === 'MEDIUM' ? 'Média' : 'Baixa'}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[row.status] ?? ''}`}>
                  {STATUS_LABELS[row.status] ?? row.status}
                </span>
              ),
            },
            {
              key: 'createdAt',
              header: 'Data',
              render: (row) => <span>{new Date(row.createdAt).toLocaleDateString('pt-BR')}</span>,
            },
            {
              key: 'actions' as string,
              header: 'Ações',
              render: (row) => (
                <Link href={`/admin/incidentes/${row.id}`}>
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
