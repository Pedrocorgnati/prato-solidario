export const dynamic = 'force-dynamic'
import { History } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

export const metadata = { title: "Histórico de Retiradas — Prato Solidário" }

// RESOLVED: /retirar/historico ausente — link quebrado no BottomNav do receptor
export default function HistoricoRetiradaPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
        Histórico de retiradas
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Todas as refeições que você retirou.
      </p>
      <EmptyState
        icon={<History className="h-8 w-8" />}
        title="Nenhuma retirada ainda"
        description="Seu histórico de refeições retiradas aparecerá aqui."
      />
    </div>
  )
}
