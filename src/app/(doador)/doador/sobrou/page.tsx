export const dynamic = 'force-dynamic'
import type { Metadata } from "next"
import { SobrouForm } from "./components/SobrouForm"

export const metadata: Metadata = {
  title: "Sobrou! | Prato Solidario",
  description:
    "Publique rapidamente o que sobrou. Pessoas proximas serao notificadas e podem retirar em ate 30 minutos.",
}

export default function SobrouPage() {
  return (
    <section className="mx-auto max-w-md space-y-6">
      {/* Urgency wrapper — orange border + tinted background */}
      <div className="rounded-2xl border-2 border-[var(--color-secondary-raw)] bg-[var(--color-secondary-raw)]/5 p-6">
        <SobrouForm />
      </div>
    </section>
  )
}
