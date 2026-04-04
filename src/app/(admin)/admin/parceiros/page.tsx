import { EmptyState } from "@/components/ui/empty-state"
import { DataTable } from "@/components/ui/data-table"
import { Building2 } from "lucide-react"

export const metadata = { title: "Parceiros — Admin" }

const mockPartners = [
  { name: "Restaurante Sabor & Arte", type: "Restaurante", status: "Ativo", city: "São Paulo" },
  { name: "ONG Esperança", type: "ONG", status: "Ativo", city: "Rio de Janeiro" },
]

export default function AdminParceirosPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Parceiros</h1>
      {mockPartners.length === 0 ? (
        <EmptyState icon={<Building2 className="h-8 w-8" />} title="Nenhum parceiro cadastrado" />
      ) : (
        <DataTable
          data={mockPartners}
          columns={[
            { key: "name", header: "Nome" },
            { key: "type", header: "Tipo" },
            { key: "status", header: "Status" },
            { key: "city", header: "Cidade" },
          ]}
        />
      )}
    </div>
  )
}
