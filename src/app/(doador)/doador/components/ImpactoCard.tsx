"use client"

import { ImpactCounter } from "@/components/shared/impact-counter"
import type { DonorMetrics } from "@/types/donation.types"

interface ImpactoCardProps {
  metrics: DonorMetrics
}

export function ImpactoCard({ metrics }: ImpactoCardProps) {
  if (metrics.totalDonations === 0) {
    return (
      <div
        data-testid="impacto-card-empty"
        className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-6 text-center"
      >
        <p className="text-lg font-semibold text-[var(--color-text-primary)]">
          Sua jornada começa agora!
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Publique sua primeira doação e veja seu impacto crescer.
        </p>
      </div>
    )
  }

  return (
    <div
      data-testid="impacto-card"
      className="grid grid-cols-2 gap-4 md:grid-cols-3"
    >
      <ImpactCounter value={metrics.totalMeals} label="Refeições doadas" />
      <ImpactCounter value={metrics.totalDonations} label="Doações realizadas" />
      {metrics.activeBannerDays > 0 && (
        <ImpactCounter
          value={metrics.activeBannerDays}
          label="Dias de banner ativo"
        />
      )}
    </div>
  )
}
