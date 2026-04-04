"use client"

import * as React from "react"
import { MarmitariaCard } from "@/components/shared/marmitaria-card"
import { FilterBar } from "@/components/ui/filter-bar"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { ChefHat } from "lucide-react"
import { listMarmitarias } from "@/actions/marmitarias"

export default function PatrocinarPage() {
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [marmitarias] = React.useState([
    {
      id: "1",
      name: "Marmitaria da Dona Maria",
      address: "Rua das Palmeiras, 45 — Vila Madalena",
      pricePerMeal: 14.0,
      rating: 4.8,
      distance: "1.2km",
    },
    {
      id: "2",
      name: "Cantina do Saber",
      address: "Av. Paulista, 200 — Bela Vista",
      pricePerMeal: 12.5,
      rating: 4.5,
      distance: "2.8km",
    },
  ])

  React.useEffect(() => {
    setLoading(false)
  }, [])

  const filtered = marmitarias.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div data-testid="patrocinar-page" className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Patrocinar Marmitas
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Escolha uma marmitaria e patrocine refeições solidárias
        </p>
      </div>
      <FilterBar
        data-testid="patrocinar-search"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar marmitaria..."
      />
      {loading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ChefHat className="h-8 w-8" />}
          title="Nenhuma marmitaria encontrada"
          description="Tente outro termo de busca."
        />
      ) : (
        <div data-testid="patrocinar-marmitarias-list" className="grid gap-4 sm:grid-cols-2">
          {filtered.map((m) => (
            <MarmitariaCard key={m.id} {...m} />
          ))}
        </div>
      )}
    </div>
  )
}
