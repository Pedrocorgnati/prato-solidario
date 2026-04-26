"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { FilterBar } from "@/components/ui/filter-bar"
import { Pagination } from "@/components/ui/pagination"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"

// ---------------------------------------------------------------------------
// Status labels e variantes de badge
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  AVAILABLE: "Disponivel",
  RESERVED: "Reservada",
  COMPLETED: "Concluida",
  EXPIRED: "Expirada",
  CANCELLED: "Cancelada",
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  AVAILABLE: "default",
  RESERVED: "secondary",
  COMPLETED: "default",
  EXPIRED: "destructive",
  CANCELLED: "destructive",
}

const FILTER_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Pendente", value: "PENDING" },
  { label: "Disponivel", value: "AVAILABLE" },
  { label: "Reservada", value: "RESERVED" },
  { label: "Concluida", value: "COMPLETED" },
  { label: "Expirada", value: "EXPIRED" },
  { label: "Cancelada", value: "CANCELLED" },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(value: unknown): string {
  if (!value) return "—"
  const d = new Date(value as string)
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function formatDateTime(value: unknown): string {
  if (!value) return "—"
  const d = new Date(value as string)
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface HistoricoClientProps {
  data: Record<string, unknown>[]
  total: number
  currentPage: number
  activeStatus: string
  dateFrom: string
  dateTo: string
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

const columns = [
  {
    key: "title" as const,
    header: "Doacao",
    render: (row: Record<string, unknown>) => {
      const title = (row.title as string) || (row.description as string) || "Doacao"
      return <span className="font-medium">{title}</span>
    },
  },
  {
    key: "status" as const,
    header: "Status",
    render: (row: Record<string, unknown>) => {
      const status = row.status as string
      return (
        <Badge variant={STATUS_VARIANT[status] ?? "outline"}>
          {STATUS_LABELS[status] ?? status}
        </Badge>
      )
    },
  },
  {
    key: "portions" as const,
    header: "Porcoes",
    render: (row: Record<string, unknown>) => {
      const portions = (row.portions as number) ?? (row.servings as number) ?? "—"
      return <span>{String(portions)}</span>
    },
  },
  {
    key: "createdAt" as const,
    header: "Data",
    render: (row: Record<string, unknown>) => {
      return <span>{formatDateTime(row.createdAt ?? row.date)}</span>
    },
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ITEMS_PER_PAGE = 20

export function HistoricoClient({
  data,
  total,
  currentPage,
  activeStatus,
  dateFrom,
  dateTo,
}: HistoricoClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      // Reset to page 1 when filters change (unless page itself is being changed)
      if (!("page" in updates)) {
        params.delete("page")
      }
      router.push(`/doador/historico?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleFilterChange = useCallback(
    (value: string) => {
      updateParams({ status: value })
    },
    [updateParams]
  )

  const handlePageChange = useCallback(
    (page: number) => {
      updateParams({ page: String(page) })
    },
    [updateParams]
  )

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <FilterBar
        filters={FILTER_OPTIONS}
        activeFilter={activeStatus}
        onFilterChange={handleFilterChange}
      />

      {/* Filtros de data */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="dateFrom" className="text-sm text-[var(--color-text-muted)] whitespace-nowrap">
            De:
          </label>
          <input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => updateParams({ dateFrom: e.target.value })}
            className="rounded-md border border-[var(--color-border-raw)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-primary)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="dateTo" className="text-sm text-[var(--color-text-muted)] whitespace-nowrap">
            Ate:
          </label>
          <input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => updateParams({ dateTo: e.target.value })}
            className="rounded-md border border-[var(--color-border-raw)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text-primary)]"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => updateParams({ dateFrom: "", dateTo: "" })}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline"
          >
            Limpar datas
          </button>
        )}
      </div>

      {/* Tabela */}
      <DataTable
        data={data}
        columns={columns}
        emptyMessage="Nenhuma doacao encontrada com esses filtros."
      />

      {/* Paginacao */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Resumo */}
      <p className="text-center text-sm text-[var(--color-text-muted)]">
        {total === 0
          ? "Nenhum resultado"
          : `Mostrando ${Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, total)}–${Math.min(currentPage * ITEMS_PER_PAGE, total)} de ${total} doacoes`}
      </p>
    </div>
  )
}
