export const dynamic = 'force-dynamic'
import Link from "next/link"
import { ChefHat, ArrowLeft, ArrowRight } from "lucide-react"
import { requireRole } from "@/lib/auth/session"
import { listSponsorHistory } from "@/actions/sponsors"
import { formatCurrency, formatRefeicoes } from "@/utils/formatters"
import { formatDateBr } from "@/utils/date"
import { DataTable } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"

export const metadata = { title: "Histórico de Patrocínios — Prato Solidário" }

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  APPROVED: { label: "Aprovado", className: "bg-green-100 text-green-700" },
  PENDING: { label: "Pendente", className: "bg-yellow-100 text-yellow-700" },
  REJECTED: { label: "Rejeitado", className: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Reembolsado", className: "bg-gray-100 text-gray-500" },
}

interface HistoryItem extends Record<string, unknown> {
  id: string
  createdAt: string
  marmitariaName: string
  quantity: number
  totalAmount: number
  paymentStatus: string
}

export default async function PatrocinioHistoricoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireRole([
    "PATROCINADOR",
    "DOADOR_PF",
    "DOADOR_RESTAURANTE",
    "SPONSOR",
    "DONOR_INDIVIDUAL",
    "DONOR_RESTAURANT",
  ])

  const params = await searchParams
  const page = Math.max(1, Number(params.page) || 1)

  const { data, totalInvested, totalPages, error } = await listSponsorHistory({
    page,
    pageSize: 10,
  })

  const items: HistoryItem[] = (data ?? []) as HistoryItem[]

  const columns = [
    {
      key: "createdAt" as const,
      header: "Data",
      render: (row: HistoryItem) => formatDateBr(row.createdAt),
    },
    {
      key: "marmitariaName" as const,
      header: "Marmitaria",
    },
    {
      key: "quantity" as const,
      header: "Refeições",
      render: (row: HistoryItem) => formatRefeicoes(row.quantity),
    },
    {
      key: "totalAmount" as const,
      header: "Valor",
      render: (row: HistoryItem) => formatCurrency(row.totalAmount),
    },
    {
      key: "paymentStatus" as const,
      header: "Status",
      render: (row: HistoryItem) => {
        const status = STATUS_MAP[row.paymentStatus]
        if (!status) return row.paymentStatus
        return (
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
        )
      },
    },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        Histórico de Patrocínios
      </h1>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={<ChefHat className="h-8 w-8" />}
            title="Nenhum patrocínio encontrado"
            description="Você ainda não patrocinou nenhuma marmitaria."
          />
          <div className="flex justify-center">
            <Link href={ROUTES.PATROCINAR}>
              <Button variant="default" size="md">
                Patrocinar agora
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Total investido em destaque */}
          <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-surface)] px-6 py-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Total investido
            </p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {formatCurrency(totalInvested ?? 0)}
            </p>
          </div>

          <DataTable<HistoryItem> data={items} columns={columns} />

          {/* Pagination */}
          {(totalPages ?? 1) > 1 && (
            <nav
              aria-label="Paginação do histórico"
              className="flex items-center justify-between pt-2"
            >
              {page > 1 ? (
                <Link
                  href={`${ROUTES.PATROCINAR_HISTORICO}?page=${page - 1}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Anterior
                </Link>
              ) : (
                <span />
              )}

              <span className="text-sm text-[var(--color-text-muted)]">
                Página {page} de {totalPages}
              </span>

              {page < (totalPages ?? 1) ? (
                <Link
                  href={`${ROUTES.PATROCINAR_HISTORICO}?page=${page + 1}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Próxima
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  )
}
