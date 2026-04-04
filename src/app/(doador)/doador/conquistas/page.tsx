import { Trophy } from "lucide-react"

export const metadata = { title: "Conquistas — Prato Solidário" }

const conquistas = [
  { icon: "🌱", title: "Primeiro Passo", desc: "Fez sua primeira doação", achieved: true, date: "Jan 2025" },
  { icon: "🔥", title: "Semana Solidária", desc: "Doou por 7 dias seguidos", achieved: true, date: "Fev 2025" },
  { icon: "💯", title: "Centena", desc: "100 refeições doadas", achieved: true, date: "Mar 2025" },
  { icon: "🌳", title: "Árvore de Impacto", desc: "200 refeições doadas", achieved: true, date: "Abr 2025" },
  { icon: "🏆", title: "Lenda Solidária", desc: "1000 refeições doadas", achieved: false },
  { icon: "⭐", title: "Estrela da Comunidade", desc: "Top 10 doadores do mês", achieved: false },
]

export default function ConquistasPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Minhas Conquistas</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {conquistas.map((c) => (
          <div
            key={c.title}
            className={`rounded-xl border p-4 text-center space-y-2 transition-opacity ${
              c.achieved
                ? "border-[var(--color-primary-raw)]/30 bg-[var(--color-primary-raw)]/5"
                : "border-[var(--color-border-raw)] bg-[var(--color-muted-raw)] opacity-50"
            }`}
          >
            <span className="text-3xl">{c.icon}</span>
            <p className="font-semibold text-sm text-[var(--color-text-primary)]">{c.title}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{c.desc}</p>
            {c.achieved && c.date && (
              <p className="text-xs text-[var(--color-success)] font-medium">{c.date}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
