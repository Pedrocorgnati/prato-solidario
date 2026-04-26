export const dynamic = 'force-dynamic'
import { getDonorMetrics } from "@/actions/donations"
import { ImpactCounter } from "@/components/shared/impact-counter"
import { EnvironmentalMetric } from "@/components/impact/EnvironmentalMetric"
import { METRICS_FACTORS } from "@/lib/constants/metrics"
import { Award } from "lucide-react"

export const metadata = { title: "Meu Impacto — Prato Solidário" }

const LEVELS = [
  { label: "Semente", min: 0, max: 50 },
  { label: "Broto", min: 50, max: 200 },
  { label: "Árvore", min: 200, max: 500 },
  { label: "Floresta", min: 500, max: 1000 },
]

export default async function ImpactoPage() {
  const metrics = await getDonorMetrics()

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-raw)]/10">
            <Award className="h-8 w-8 text-[var(--color-primary-raw)]" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Corrente do Bem
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Seu impacto acumulado desde que começou a doar
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <ImpactCounter value={metrics.totalMeals} label="Refeições doadas" />
        <ImpactCounter
          value={metrics.totalDonations}
          label="Doações realizadas"
        />
        {metrics.activeBannerDays > 0 && (
          <ImpactCounter
            value={metrics.activeBannerDays}
            label="Dias de banner ativo"
          />
        )}
      </div>

      {/* Impacto ambiental pessoal */}
      <div className="rounded-xl border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-6">
        <EnvironmentalMetric
          userId="current"
          data={{
            totalMeals: metrics.totalMeals,
            kgFoodSaved: metrics.totalMeals * METRICS_FACTORS.KG_PER_MEAL,
            kgCO2Avoided: metrics.totalMeals * METRICS_FACTORS.KG_PER_MEAL * METRICS_FACTORS.CO2_FACTOR_IPCC,
          }}
        />
      </div>

      <div className="rounded-xl border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-6">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-3">
          Nível de impacto
        </h2>
        <div className="space-y-3">
          {LEVELS.map((nivel) => {
            const achieved = metrics.totalMeals >= nivel.max
            const current =
              !achieved &&
              metrics.totalMeals >= nivel.min &&
              metrics.totalMeals < nivel.max

            return (
              <div key={nivel.label} className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-lg ${
                    achieved
                      ? "bg-[var(--color-primary-raw)] text-white"
                      : current
                        ? "bg-[var(--color-warning)]/20 text-[var(--color-warning)]"
                        : "bg-[var(--color-muted-raw)] text-[var(--color-text-muted)]"
                  }`}
                >
                  {achieved ? "\u2713" : current ? "\u25CF" : "\u25CB"}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span
                      className={
                        achieved || current
                          ? "font-semibold text-[var(--color-text-primary)]"
                          : "text-[var(--color-text-muted)]"
                      }
                    >
                      {nivel.label}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {nivel.min}&ndash;{nivel.max} refeições
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
