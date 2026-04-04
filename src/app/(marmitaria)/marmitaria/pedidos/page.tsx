import { Utensils } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

export const metadata = { title: "Pedidos — Prato Solidário" }

// RESOLVED: /marmitaria/pedidos ausente — link quebrado no BottomNav da marmitaria
export default function PedidosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Pedidos</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Marmitas solicitadas por patrocinadores aguardando preparo.
        </p>
      </div>
      <EmptyState
        icon={<Utensils className="h-8 w-8" />}
        title="Nenhum pedido no momento"
        description="Os pedidos de marmitas patrocinadas aparecerão aqui assim que chegarem."
      />
    </div>
  )
}
