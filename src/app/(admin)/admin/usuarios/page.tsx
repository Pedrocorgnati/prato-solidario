import { listUsers } from "@/actions/admin"
import { DataTable } from "@/components/ui/data-table"
import { FilterBar } from "@/components/ui/filter-bar"
import { EmptyState } from "@/components/ui/empty-state"
import { Users } from "lucide-react"

export const metadata = { title: "Usuários — Admin" }

export default async function AdminUsuariosPage() {
  const { data } = await listUsers()

  const mockUsers = [
    { name: "João da Silva", email: "joao@email.com", role: "DOADOR", status: "Ativo", joined: "Jan 2025" },
    { name: "Maria L.", email: "maria@email.com", role: "RECEPTOR", status: "Ativo", joined: "Fev 2025" },
    { name: "Carlos M.", email: "carlos@email.com", role: "MARMITARIA", status: "Pendente", joined: "Mar 2025" },
  ]

  return (
    <div data-testid="admin-usuarios-page" className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Usuários</h1>
      <FilterBar data-testid="admin-usuarios-search" searchPlaceholder="Buscar usuário..." />
      {mockUsers.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="Nenhum usuário" />
      ) : (
        <DataTable
          data-testid="admin-usuarios-table"
          data={mockUsers}
          columns={[
            { key: "name", header: "Nome" },
            { key: "email", header: "E-mail" },
            { key: "role", header: "Perfil" },
            { key: "status", header: "Status" },
            { key: "joined", header: "Cadastro" },
          ]}
        />
      )}
    </div>
  )
}
