export const dynamic = 'force-dynamic'
import { MapPin } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

export const metadata = { title: "Refeições Próximas — Prato Solidário" }

// RESOLVED: /retirar/proximos ausente — link quebrado no BottomNav do receptor
export default function ProximosPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
        Refeições próximas
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Doações disponíveis perto de você agora.
      </p>
      <EmptyState
        icon={<MapPin className="h-8 w-8" />}
        title="Nenhuma refeição próxima agora"
        description="Assim que houver doações disponíveis na sua região, elas aparecerão aqui. Tente novamente em alguns minutos."
      />
    </div>
  )
}
