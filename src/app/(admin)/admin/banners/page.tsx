import { listBanners } from "@/actions/banners"
import { DataTable } from "@/components/ui/data-table"
import { EmptyState } from "@/components/ui/empty-state"
import { Image as ImageIcon } from "lucide-react"

export const metadata = { title: "Banners — Admin" }

export default async function AdminBannersPage() {
  const { data } = await listBanners()
  const mockBanners = [
    { sponsor: "Empresa ABC", status: "Ativo", start: "01/04", end: "30/04", days: "30" },
    { sponsor: "Loja XYZ", status: "Agendado", start: "01/05", end: "31/05", days: "31" },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Banners Publicitários</h1>
      {mockBanners.length === 0 ? (
        <EmptyState icon={<ImageIcon className="h-8 w-8" />} title="Nenhum banner cadastrado" />
      ) : (
        <DataTable
          data={mockBanners}
          columns={[
            { key: "sponsor", header: "Patrocinador" },
            { key: "status", header: "Status" },
            { key: "start", header: "Início" },
            { key: "end", header: "Fim" },
            { key: "days", header: "Dias" },
          ]}
        />
      )}
    </div>
  )
}
