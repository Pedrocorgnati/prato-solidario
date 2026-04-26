export const dynamic = 'force-dynamic'
import { Suspense } from "react"
import { EmptyState } from "@/components/ui/empty-state"
import { History } from "lucide-react"
import { listDonations } from "@/actions/donations"
import { HistoricoClient } from "./historico-client"

export const metadata = { title: "Historico de Doacoes — Prato Solidario" }

interface HistoricoSearchParams {
  page?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export default function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<HistoricoSearchParams>
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Historico de Doacoes</h1>
      <Suspense
        fallback={
          <div className="py-12 text-center text-[var(--color-text-muted)]">Carregando...</div>
        }
      >
        <HistoricoContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function HistoricoContent({
  searchParams,
}: {
  searchParams: Promise<HistoricoSearchParams>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1)
  const status = params.status ?? ""
  const dateFrom = params.dateFrom ?? ""
  const dateTo = params.dateTo ?? ""

  const { data, total } = await listDonations({
    page,
    status: status || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })

  // Show empty state only when there are no filters and no data
  const hasFilters = status || dateFrom || dateTo
  if (data.length === 0 && !hasFilters && page === 1) {
    return (
      <EmptyState
        icon={<History className="h-8 w-8" />}
        title="Nenhuma doacao ainda"
        description="Seu historico de doacoes aparecera aqui."
      />
    )
  }

  return (
    <HistoricoClient
      data={data}
      total={total}
      currentPage={page}
      activeStatus={status}
      dateFrom={dateFrom}
      dateTo={dateTo}
    />
  )
}
