import { DataTable } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { AlertOctagon } from "lucide-react"

export const metadata = { title: "Denúncias — Admin" }

const mockReports = [
  { id: "D-001", reporter: "Ana P.", target: "João S.", reason: "Doação não entregue", status: "Pendente", date: "02/04/2025" },
]

export default function AdminDenunciasPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Denúncias</h1>
      {mockReports.length === 0 ? (
        <EmptyState icon={<AlertOctagon className="h-8 w-8" />} title="Nenhuma denúncia" />
      ) : (
        <DataTable
          data={mockReports}
          columns={[
            { key: "id", header: "ID" },
            { key: "reporter", header: "Denunciante" },
            { key: "target", header: "Denunciado" },
            { key: "reason", header: "Motivo" },
            { key: "status", header: "Status" },
            { key: "date", header: "Data" },
          ]}
        />
      )}
    </div>
  )
}
