import { DataTable } from "@/components/ui/data-table"
import { listSponsorHistory } from "@/actions/sponsors"

export const metadata = { title: "Histórico de Patrocínios — Prato Solidário" }

export default async function PatrocinioHistoricoPage() {
  const { data } = await listSponsorHistory()

  const mockData = [
    { marmitaria: "Marmitaria da Dona Maria", meals: "5", value: "R$ 70,00", date: "01/04/2025", status: "Entregue" },
    { marmitaria: "Cantina do Saber", meals: "3", value: "R$ 37,50", date: "15/03/2025", status: "Entregue" },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Histórico de Patrocínios</h1>
      <DataTable
        data={mockData}
        columns={[
          { key: "marmitaria", header: "Marmitaria" },
          { key: "meals", header: "Marmitas" },
          { key: "value", header: "Valor" },
          { key: "status", header: "Status" },
          { key: "date", header: "Data" },
        ]}
      />
    </div>
  )
}
