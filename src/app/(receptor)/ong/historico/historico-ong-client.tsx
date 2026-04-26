"use client"

/**
 * HistoricoOngClient — Histórico interativo de códigos para ONG.
 * Suporta filtros por status e período, paginação e exportação CSV.
 * @see module-10-codigos-historico/TASK-7/ST002
 */

import * as React from "react"
import { toast } from "sonner"
import { History } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { formatDateTimeBr } from "@/utils/date"
import type { CodeHistoryResult } from "@/repositories/retrieval.repository"
import type { RetrievalCode } from "@prisma/client"

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { label: "Todos", value: "" },
  { label: "Confirmado", value: "CONFIRMED" },
  { label: "Expirado", value: "EXPIRED" },
  { label: "Cancelado", value: "CANCELLED" },
  { label: "Ausência registrada", value: "NO_SHOW" },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function HistoricoStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "CONFIRMED":
      return (
        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[var(--color-info)]/10 text-[var(--color-info)]">
          Confirmado
        </span>
      )
    case "EXPIRED":
      return (
        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[var(--color-muted-raw)] text-[var(--color-text-muted)]">
          Expirado
        </span>
      )
    case "CANCELLED":
      return (
        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[var(--color-error)]/10 text-[var(--color-error)]">
          Cancelado
        </span>
      )
    case "NO_SHOW":
      return (
        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
          Ausência
        </span>
      )
    default:
      return (
        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[var(--color-muted-raw)] text-[var(--color-text-muted)]">
          {status}
        </span>
      )
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "CONFIRMED": return "Confirmado"
    case "EXPIRED":   return "Expirado"
    case "CANCELLED": return "Cancelado"
    case "NO_SHOW":   return "Ausência"
    default:          return status
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface HistoricoOngClientProps {
  initialData: CodeHistoryResult
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HistoricoOngClient({ initialData }: HistoricoOngClientProps) {
  // Filter state
  const [statusFilter, setStatusFilter] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")

  // Pending filter values (committed only on "Filtrar")
  const [pendingStatus, setPendingStatus] = React.useState("")
  const [pendingStart, setPendingStart] = React.useState("")
  const [pendingEnd, setPendingEnd] = React.useState("")

  // Data state
  const [data, setData] = React.useState<RetrievalCode[]>(initialData.data)
  const [pagination, setPagination] = React.useState(initialData.pagination)
  const [loading, setLoading] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)

  // ---------------------------------------------------------------------------
  // Fetch data
  // ---------------------------------------------------------------------------

  const fetchData = React.useCallback(
    async (page: number, status: string, start: string, end: string) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set("page", String(page))
        params.set("pageSize", String(PAGE_SIZE))
        if (status) params.set("status", status)
        // API expects ISO datetime; append time component if only date is given
        if (start) params.set("startDate", start.length === 10 ? `${start}T00:00:00.000Z` : start)
        if (end)   params.set("endDate",   end.length === 10   ? `${end}T23:59:59.999Z`   : end)

        const res = await fetch(`/api/v1/codes/history?${params.toString()}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          toast.error(body.message ?? "Erro ao buscar histórico. Tente novamente.")
          return
        }
        const result: CodeHistoryResult = await res.json()
        setData(result.data)
        setPagination(result.pagination)
      } catch {
        toast.error("Erro inesperado ao buscar histórico.")
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleFilter = () => {
    setStatusFilter(pendingStatus)
    setStartDate(pendingStart)
    setEndDate(pendingEnd)
    fetchData(1, pendingStatus, pendingStart, pendingEnd)
  }

  const handleClearFilters = () => {
    setPendingStatus("")
    setPendingStart("")
    setPendingEnd("")
    setStatusFilter("")
    setStartDate("")
    setEndDate("")
    fetchData(1, "", "", "")
  }

  const handlePageChange = (page: number) => {
    fetchData(page, statusFilter, startDate, endDate)
  }

  const handleExportCsv = () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (startDate)    params.set("startDate", startDate.length === 10 ? `${startDate}T00:00:00.000Z` : startDate)
      if (endDate)      params.set("endDate",   endDate.length === 10   ? `${endDate}T23:59:59.999Z`   : endDate)

      window.open(`/api/v1/codes/history/export?${params.toString()}`, "_blank")
    } finally {
      // Give a small delay to re-enable the button after tab opens
      setTimeout(() => setExporting(false), 1000)
    }
  }

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  const hasActiveFilters = statusFilter || startDate || endDate
  const isEmpty = data.length === 0

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          {/* Status */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="status-filter"
              className="text-xs font-medium text-[var(--color-text-muted)]"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={pendingStatus}
              onChange={(e) => setPendingStatus(e.target.value)}
              className="rounded-md border border-[var(--color-border-raw)] bg-[var(--color-background)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-raw)]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Data de — De */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="start-date"
              className="text-xs font-medium text-[var(--color-text-muted)]"
            >
              De
            </label>
            <input
              id="start-date"
              type="date"
              value={pendingStart}
              onChange={(e) => setPendingStart(e.target.value)}
              max={pendingEnd || undefined}
              className="rounded-md border border-[var(--color-border-raw)] bg-[var(--color-background)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-raw)]"
            />
          </div>

          {/* Data de — Até */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="end-date"
              className="text-xs font-medium text-[var(--color-text-muted)]"
            >
              Até
            </label>
            <input
              id="end-date"
              type="date"
              value={pendingEnd}
              onChange={(e) => setPendingEnd(e.target.value)}
              min={pendingStart || undefined}
              className="rounded-md border border-[var(--color-border-raw)] bg-[var(--color-background)] px-3 py-1.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-raw)]"
            />
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 sm:mt-0 mt-1">
            <Button
              variant="default"
              size="sm"
              onClick={handleFilter}
              disabled={loading}
            >
              {loading ? "Filtrando..." : "Filtrar"}
            </Button>
            {(pendingStatus || pendingStart || pendingEnd || hasActiveFilters) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cabeçalho com contagem e exportação */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-muted)]">
          {loading
            ? "Carregando..."
            : pagination.total === 0
              ? "Nenhum registro encontrado"
              : `${pagination.total} registro${pagination.total !== 1 ? "s" : ""} encontrado${pagination.total !== 1 ? "s" : ""}`}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={isEmpty || exporting}
        >
          {exporting ? "Exportando..." : "Exportar CSV"}
        </Button>
      </div>

      {/* Tabela */}
      {isEmpty && !loading ? (
        <EmptyState
          icon={<History className="h-8 w-8" />}
          title="Nenhum registro encontrado"
          description="Nenhum registro encontrado para os filtros selecionados."
        />
      ) : (
        <div className="w-full overflow-x-auto rounded-lg border border-[var(--color-border-raw)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface)]">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)] whitespace-nowrap"
                >
                  Data/Hora
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)] whitespace-nowrap"
                >
                  Código
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)] whitespace-nowrap"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)] whitespace-nowrap"
                >
                  Quantidade
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)] whitespace-nowrap"
                >
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-[var(--color-text-muted)]"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : (
                data.map((code) => (
                  <tr
                    key={code.id}
                    className="border-t border-[var(--color-border-raw)] hover:bg-[var(--color-surface)] transition-colors"
                  >
                    {/* Data/Hora */}
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] whitespace-nowrap">
                      {formatDateTimeBr(code.createdAt)}
                    </td>

                    {/* Código */}
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-[var(--color-text-primary)]">
                        {code.code}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <HistoricoStatusBadge status={code.status} />
                    </td>

                    {/* Quantidade */}
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {code.portions}
                    </td>

                    {/* Ação */}
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {statusLabel(code.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
          >
            Anterior
          </Button>
          <span className="text-sm text-[var(--color-text-muted)]">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
