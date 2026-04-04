import { listIncidents } from "@/actions/admin"
import { DataTable } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { AlertTriangle } from "lucide-react"

export const metadata = { title: "Incidentes — Admin" }

export default async function AdminIncidentesPage() {
  const { data } = await listIncidents()
  const mockData = [
    { id: "I-001", type: "Segurança alimentar", severity: "Alta", status: "Aberto", date: "02/04/2025" },
    { id: "I-002", type: "Usuário suspeito", severity: "Média", status: "Em análise", date: "01/04/2025" },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Incidentes</h1>
      {mockData.length === 0 ? (
        <EmptyState icon={<AlertTriangle className="h-8 w-8" />} title="Nenhum incidente aberto" />
      ) : (
        <DataTable
          data={mockData}
          columns={[
            { key: "id", header: "ID" },
            { key: "type", header: "Tipo" },
            { key: "severity", header: "Severidade" },
            { key: "status", header: "Status" },
            { key: "date", header: "Data" },
          ]}
        />
      )}
    </div>
  )
}
