"use client"

import * as React from "react"
import { Plus, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DonationCard } from "@/components/shared/donation-card"
import { BannerSlot } from "@/components/shared/banner-slot"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { DonationStatus, ROUTES } from "@/lib/constants"
import { useRouter } from "next/navigation"
import Link from "next/link"

const mockStats = [
  { label: "Doações ativas", value: "3", color: "text-[var(--color-primary-raw)]" },
  { label: "Refeições doadas", value: "284", color: "text-[var(--color-secondary-raw)]" },
  { label: "Pessoas impactadas", value: "419", color: "text-[var(--color-info)]" },
  { label: "CO₂ evitado (kg)", value: "12", color: "text-[var(--color-success)]" },
]

export default function DoadorDashboardPage() {
  const router = useRouter()
  const [loading] = React.useState(false)

  const mockDonations = [
    {
      id: "1",
      title: "Marmitas de frango com arroz",
      donorName: "Você",
      address: "Rua das Flores, 123 — Centro",
      servings: 12,
      status: DonationStatus.DISPONIVEL,
      windowEnd: "14:00",
    },
    {
      id: "2",
      title: "Sopa de legumes",
      donorName: "Você",
      address: "Rua das Flores, 123 — Centro",
      servings: 8,
      status: DonationStatus.URGENTE,
      windowEnd: "13:30",
    },
  ]

  return (
    <div data-testid="doador-dashboard" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Painel do Doador</h1>
        <Link href={ROUTES.DOADOR_NOVA}>
          <Button data-testid="doador-nova-doacao-button" variant="default" size="md">
            <Plus className="mr-2 h-4 w-4" />
            Nova doação
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div data-testid="doador-stats" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {mockStats.map((stat) => (
          <div
            key={stat.label}
            data-testid={`doador-stat-${stat.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
            className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4 space-y-1"
          >
            <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Banner */}
      <BannerSlot />

      {/* Botão Sobrou! flutuante */}
      <Button
        data-testid="doador-sobrou-button"
        variant="secondary"
        size="lg"
        className="w-full animate-subtle-pulse"
        onClick={() => router.push(ROUTES.DOADOR_SOBROU)}
      >
        <Star className="mr-2 h-5 w-5" />
        Sobrou! Publicar agora
      </Button>

      {/* Doações ativas */}
      <div data-testid="doador-doacoes-ativas">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
          Doações ativas
        </h2>
        {loading ? (
          <LoadingSkeleton variant="card" count={2} />
        ) : mockDonations.length === 0 ? (
          <EmptyState
            title="Nenhuma doação ativa"
            description="Publique uma doação para começar a impactar vidas."
            action={{ label: "Publicar doação", onClick: () => router.push(ROUTES.DOADOR_NOVA) }}
          />
        ) : (
          <div className="space-y-3">
            {mockDonations.map((d) => (
              <DonationCard key={d.id} {...d} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
