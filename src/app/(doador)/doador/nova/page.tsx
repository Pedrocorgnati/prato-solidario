export const dynamic = 'force-dynamic'
import type { Metadata } from "next"
import { DoacaoForm } from "./components/DoacaoForm"

export const metadata: Metadata = {
  title: "Publicar doação | Prato Solidário",
  description: "Publique uma doação de alimentos e ajude quem mais precisa.",
}

export default function NovaDoacaoPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        Publicar doação
      </h1>
      <DoacaoForm />
    </div>
  )
}
