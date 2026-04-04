import { Trophy } from "lucide-react"
import { ImpactCounter } from "@/components/shared/impact-counter"

// RESOLVED: generateMetadata com description e openGraph
export const metadata = {
  title: "Hall da Fama — Prato Solidário",
  description: "Conheça os maiores doadores e marmitarias solidárias do Prato Solidário. Cada refeição doada conta!",
  openGraph: {
    title: "Hall da Fama — Prato Solidário",
    description: "Os heróis da solidariedade: doadores e marmitarias que mais contribuíram para acabar com a fome.",
  },
}

const topDonors = [
  { name: "Restaurante Sabor & Arte", meals: 3400, city: "São Paulo, SP" },
  { name: "Maria da Silva", meals: 1200, city: "Rio de Janeiro, RJ" },
  { name: "Cantina do Zé", meals: 980, city: "Belo Horizonte, MG" },
  { name: "Igreja Comunidade Viva", meals: 750, city: "Curitiba, PR" },
  { name: "Ana Lucia Ferreira", meals: 620, city: "Fortaleza, CE" },
]

export default function HallDaFamaPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-raw)]/20">
            <Trophy className="h-8 w-8 text-[var(--color-warning)]" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--color-text-primary)]">
          Hall da Fama
        </h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Honrando quem mais transforma vidas através da solidariedade
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-12 md:grid-cols-4">
        <ImpactCounter value={12480} label="Refeições totais" />
        <ImpactCounter value={3200} label="Famílias" />
        <ImpactCounter value={87} label="Parceiros ativos" />
        <ImpactCounter value={420} label="kg CO₂ evitados" suffix="kg" />
      </div>

      <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">
        Top 5 doadores do mês
      </h2>
      <div className="space-y-3">
        {topDonors.map((donor, idx) => (
          <div
            key={donor.name}
            className="flex items-center gap-4 rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-lg ${
                idx === 0
                  ? "bg-[var(--color-accent-raw)] text-[var(--color-on-accent)]"
                  : idx === 1
                    ? "bg-[var(--color-text-muted)]/20 text-[var(--color-text-secondary)]"
                    : idx === 2
                      ? "bg-[var(--color-secondary-raw)]/20 text-[var(--color-secondary-raw)]"
                      : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"
              }`}
            >
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--color-text-primary)] truncate">{donor.name}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{donor.city}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[var(--color-primary-raw)]">{donor.meals.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-[var(--color-text-muted)]">refeições</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
