import { EmptyState } from "@/components/ui/empty-state"
import { Tag } from "lucide-react"

export const metadata = { title: "Códigos — Marmitaria" }

export default function MarmitariaCodigosPage() {
  const codes = [
    { code: "4829", buyer: "João S.", meals: 3, status: "Pendente", date: "Hoje 12:30" },
    { code: "3701", buyer: "Maria L.", meals: 2, status: "Entregue", date: "Hoje 11:00" },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Códigos de Retirada</h1>
      {codes.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-8 w-8" />}
          title="Nenhum código ativo"
          description="Quando alguém patrocinar marmitas, os códigos aparecerão aqui."
        />
      ) : (
        <div className="space-y-3">
          {codes.map((c) => (
            <div key={c.code} className="flex items-center justify-between rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4">
              <div>
                <p className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">{c.code}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{c.buyer} · {c.meals} marmitas</p>
                <p className="text-xs text-[var(--color-text-muted)]">{c.date}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${c.status === "Entregue" ? "bg-[var(--color-success)]/10 text-[var(--color-success)]" : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"}`}>
                {c.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
