import { DataTable } from "@/components/ui/data-table"

export const metadata = { title: "Pagamentos — Marmitaria" }

const mockPayments = [
  { id: "PAG-001", description: "4 marmitas", value: "R$ 56,00", status: "Pago", date: "01/04/2025" },
  { id: "PAG-002", description: "2 marmitas", value: "R$ 28,00", status: "Pago", date: "02/04/2025" },
  { id: "PAG-003", description: "6 marmitas", value: "R$ 84,00", status: "Pendente", date: "03/04/2025" },
]

export default function PagamentosPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Pagamentos</h1>
      <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4">
        <p className="text-sm text-[var(--color-text-muted)]">Total a receber</p>
        <p className="text-3xl font-bold text-[var(--color-primary-raw)]">R$ 1.278,00</p>
      </div>
      <DataTable
        data={mockPayments}
        columns={[
          { key: "id", header: "Referência" },
          { key: "description", header: "Descrição" },
          { key: "value", header: "Valor" },
          { key: "status", header: "Status" },
          { key: "date", header: "Data" },
        ]}
      />
    </div>
  )
}
