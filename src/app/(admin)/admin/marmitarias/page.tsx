import { listMarmitarias } from "@/actions/marmitarias"
import { DataTable } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { ChefHat } from "lucide-react"

export const metadata = { title: "Marmitarias — Admin" }

export default async function AdminMarmitariasPage() {
  const { data } = await listMarmitarias()
  const mockData = [
    { name: "Marmitaria da Dona Maria", city: "São Paulo", status: "Ativa", price: "R$ 14,00", rating: "4.8" },
    { name: "Cantina do Saber", city: "São Paulo", status: "Ativa", price: "R$ 12,50", rating: "4.5" },
    { name: "Tempero Caseiro", city: "Guarulhos", status: "Pendente", price: "R$ 13,00", rating: "-" },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Marmitarias</h1>
      {mockData.length === 0 ? (
        <EmptyState icon={<ChefHat className="h-8 w-8" />} title="Nenhuma marmitaria" />
      ) : (
        <DataTable
          data={mockData}
          columns={[
            { key: "name", header: "Nome" },
            { key: "city", header: "Cidade" },
            { key: "status", header: "Status" },
            { key: "price", header: "Preço" },
            { key: "rating", header: "Avaliação" },
          ]}
        />
      )}
    </div>
  )
}
