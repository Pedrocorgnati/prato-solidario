import { ImpactCounter } from "@/components/shared/impact-counter"
import { Award } from "lucide-react"

export const metadata = { title: "Meu Impacto — Prato Solidário" }

export default function ImpactoPage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-raw)]/10">
            <Award className="h-8 w-8 text-[var(--color-primary-raw)]" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Corrente do Bem</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Seu impacto acumulado desde que começou a doar
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <ImpactCounter value={284} label="Refeições doadas" />
        <ImpactCounter value={419} label="Pessoas impactadas" />
        <ImpactCounter value={12} label="kg de CO₂ evitados" suffix="kg" />
        <ImpactCounter value={8} label="Meses doando" />
      </div>

      <div className="rounded-xl border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-6">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">Nível de impacto</h2>
        <div className="space-y-3">
          {[
            { label: "Semente", min: 0, max: 50, achieved: true },
            { label: "Broto", min: 50, max: 200, achieved: true },
            { label: "Árvore", min: 200, max: 500, achieved: true },
            { label: "Floresta", min: 500, max: 1000, achieved: false },
          ].map((nivel) => (
            <div key={nivel.label} className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-lg ${nivel.achieved ? "bg-[var(--color-primary-raw)] text-white" : "bg-[var(--color-muted-raw)] text-[var(--color-text-muted)]"}`}>
                {nivel.achieved ? "✓" : "○"}
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className={nivel.achieved ? "font-semibold text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}>
                    {nivel.label}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {nivel.min}–{nivel.max} refeições
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
