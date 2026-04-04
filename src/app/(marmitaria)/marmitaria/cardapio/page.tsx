import { BookOpen } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

export const metadata = { title: "Cardápio — Prato Solidário" }

// RESOLVED: /marmitaria/cardapio ausente — link quebrado no BottomNav da marmitaria
export default function CardapioPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Cardápio</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Gerencie as marmitas disponíveis para patrocínio.
        </p>
      </div>
      <EmptyState
        icon={<BookOpen className="h-8 w-8" />}
        title="Cardápio não configurado"
        description="Adicione suas marmitas para começar a receber patrocínios."
      />
    </div>
  )
}
