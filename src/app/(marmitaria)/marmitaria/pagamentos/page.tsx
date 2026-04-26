"use client"
export const dynamic = 'force-dynamic'

import * as React from "react"
import { Download, Loader2, AlertCircle, Banknote, ChevronLeft, ChevronRight } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/utils/formatters"
import { formatDateBr } from "@/utils/date"
import { toast } from "sonner"

type PeriodFilter = "week" | "month" | "quarter" | "custom"
type SourceFilter = "all" | "sponsor" | "direct"

interface PaymentItem {
  id: string
  createdAt: string
  amount: number
  status: string
  mpTransactionId: string | null
  mealCount: number
  source?: "sponsor" | "direct"
}

interface PaymentsResponse {
  data: PaymentItem[]
  total: number
  page: number
  pageSize: number
}

function getPeriodDates(period: PeriodFilter): { from?: string; to?: string } {
  if (period === "custom") return {}
  const now = new Date()
  const to = now.toISOString()

  if (period === "week") {
    const start = new Date(now)
    start.setDate(now.getDate() - 7)
    return { from: start.toISOString(), to }
  }
  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: start.toISOString(), to }
  }
  // quarter
  const start = new Date(now)
  start.setMonth(now.getMonth() - 3)
  return { from: start.toISOString(), to }
}

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  week: "Esta semana",
  month: "Este mês",
  quarter: "Último trimestre",
  custom: "Todos",
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  APPROVED: { label: "Pago", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  PENDING: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  REJECTED: { label: "Rejeitado", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  REFUNDED: { label: "Reembolsado", className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
}

const PAGE_SIZE = 20

export default function PagamentosPage() {
  const [data, setData] = React.useState<PaymentItem[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [period, setPeriod] = React.useState<PeriodFilter>("month")
  const [source, setSource] = React.useState<SourceFilter>("all")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")
  const [exporting, setExporting] = React.useState(false)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchPayments = React.useCallback(async (pg: number, pd: PeriodFilter, src: SourceFilter) => {
    setLoading(true)
    setError("")
    try {
      const dates = getPeriodDates(pd)
      const params = new URLSearchParams({ page: String(pg), pageSize: String(PAGE_SIZE) })
      if (dates.from) params.set("from", dates.from)
      if (dates.to) params.set("to", dates.to)
      if (src !== "all") params.set("source", src)

      const res = await fetch(`/api/v1/marmitarias/payments?${params}`)
      if (!res.ok) {
        throw new Error("Erro ao carregar pagamentos")
      }
      const json: PaymentsResponse = await res.json()
      setData(json.data)
      setTotal(json.total)
    } catch {
      setError("Não foi possível carregar os pagamentos. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchPayments(page, period, source)
  }, [page, period, source, fetchPayments])

  function handlePeriodChange(newPeriod: PeriodFilter) {
    setPeriod(newPeriod)
    setPage(1)
  }

  function handleSourceChange(newSource: SourceFilter) {
    setSource(newSource)
    setPage(1)
  }

  async function handleExportCsv() {
    setExporting(true)
    try {
      const dates = getPeriodDates(period)
      const params = new URLSearchParams({ export: "true" })
      if (dates.from) params.set("from", dates.from)
      if (dates.to) params.set("to", dates.to)

      const res = await fetch(`/api/v1/marmitarias/payments?${params}`)
      if (!res.ok) throw new Error("Erro ao exportar")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `pagamentos-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("CSV exportado com sucesso!")
    } catch {
      toast.error("Erro ao exportar CSV. Tente novamente.")
    } finally {
      setExporting(false)
    }
  }

  const totalReceived = data
    .filter((item) => item.status === "APPROVED")
    .reduce((sum, item) => sum + item.amount, 0)

  const columns = [
    {
      key: "createdAt" as const,
      header: "Data",
      render: (row: PaymentItem) => formatDateBr(row.createdAt),
    },
    {
      key: "mealCount" as const,
      header: "Marmitas",
      render: (row: PaymentItem) => String(row.mealCount),
    },
    {
      key: "amount" as const,
      header: "Valor",
      render: (row: PaymentItem) => formatCurrency(row.amount),
    },
    {
      key: "status" as const,
      header: "Status",
      render: (row: PaymentItem) => {
        const s = STATUS_LABELS[row.status] ?? { label: row.status, className: "bg-gray-100 text-gray-800" }
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.className}`}>
            {s.label}
          </span>
        )
      },
    },
    {
      key: "source" as const,
      header: "Origem",
      render: (row: PaymentItem) => {
        const isSponsor = (row.source ?? "sponsor") === "sponsor"
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              isSponsor
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            }`}
          >
            {isSponsor ? "Patrocínio" : "Venda direta"}
          </span>
        )
      },
    },
    {
      key: "mpTransactionId" as const,
      header: "ID Transação",
      render: (row: PaymentItem) => (
        <span className="font-mono text-xs text-[var(--color-text-muted)]">
          {row.mpTransactionId ?? "—"}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Pagamentos</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={exporting || loading || data.length === 0}
        >
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exportar CSV
        </Button>
      </div>

      {/* Total recebido */}
      <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4">
        <p className="text-sm text-[var(--color-text-muted)]">Total recebido no período</p>
        <p className="text-3xl font-bold text-[var(--color-primary-raw)]">
          {loading ? "..." : formatCurrency(totalReceived)}
        </p>
      </div>

      {/* Filtro de período */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handlePeriodChange(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              period === key
                ? "bg-[var(--color-primary-raw)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-muted-raw)]"
            }`}
          >
            {PERIOD_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Filtro de origem (sponsor|direct|all) — TASK-6/ST004 */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por origem">
        {([
          { key: "all", label: "Todos" },
          { key: "sponsor", label: "Patrocínios" },
          { key: "direct", label: "Vendas diretas" },
        ] as { key: SourceFilter; label: string }[]).map((opt) => (
          <button
            key={opt.key}
            type="button"
            role="tab"
            aria-selected={source === opt.key}
            onClick={() => handleSourceChange(opt.key)}
            className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
              source === opt.key
                ? "border-[var(--color-primary-raw)] bg-[var(--color-primary-raw)]/10 text-[var(--color-primary-raw)]"
                : "border-[var(--color-border-raw)] bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Conteúdo principal */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary-raw)]" />
        </div>
      ) : error ? (
        <EmptyState
          icon={<AlertCircle className="h-8 w-8" />}
          title="Erro ao carregar"
          description={error}
          action={{ label: "Tentar novamente", onClick: () => fetchPayments(page, period, source) }}
        />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Banknote className="h-8 w-8" />}
          title="Nenhum pagamento encontrado"
          description="Não há pagamentos registrados para o período selecionado."
        />
      ) : (
        <>
          <DataTable
            data={data as unknown as Record<string, unknown>[]}
            columns={columns as Parameters<typeof DataTable>[0]["columns"]}
            emptyMessage="Nenhum pagamento encontrado."
          />

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--color-text-muted)]">
                Página {page} de {totalPages} ({total} registros)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
