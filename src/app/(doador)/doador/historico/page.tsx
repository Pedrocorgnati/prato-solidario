import { DataTable } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { History } from "lucide-react"
import { listDonations } from "@/actions/donations"

export const metadata = { title: "Histórico de Doações — Prato Solidário" }

export default async function HistoricoPage() {
  const { data } = await listDonations()

  if (data.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Histórico</h1>
        <EmptyState
          icon={<History className="h-8 w-8" />}
          title="Nenhuma doação ainda"
          description="Seu histórico de doações aparecerá aqui."
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Histórico de Doações</h1>
      <DataTable
        data={data as Record<string, unknown>[]}
        columns={[
          { key: "title", header: "Doação" },
          { key: "status", header: "Status" },
          { key: "servings", header: "Porções" },
          { key: "date", header: "Data" },
        ]}
        emptyMessage="Nenhuma doação encontrada."
      />
    </div>
  )
}
