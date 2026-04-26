'use client'
export const dynamic = 'force-dynamic'

/**
 * Página de patrocínio — solicita geolocalização para filtrar marmitarias próximas.
 * Substituiu Server Component (intake-review TASK-9 ST004)
 */

import * as React from 'react'
import { ChefHat } from 'lucide-react'
import { toast } from 'sonner'
import { MarmitariaCard } from '@/components/shared/marmitaria-card'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'

interface MarmitariaItem {
  id: string
  name: string
  tradeName?: string
  photo?: string | null
  neighborhood?: string | null
  city?: string | null
  address?: string | null
  pricePerMeal?: number | null
  rating?: number | null
  distance?: number | null
}

export default function PatrocinarPage() {
  const [marmitarias, setMarmitarias] = React.useState<MarmitariaItem[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    function fetchMarmitarias(lat?: number, lng?: number) {
      const params = new URLSearchParams({ pageSize: '50' })
      if (lat !== undefined && lng !== undefined) {
        params.set('lat', String(lat))
        params.set('lng', String(lng))
        params.set('radius', '10') // 10km default
      }

      fetch(`/api/v1/marmitarias/public?${params.toString()}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then((data) => setMarmitarias(data.items ?? []))
        .catch(() => toast.error('Erro ao carregar marmitarias. Tente recarregar.'))
        .finally(() => setLoading(false))
    }

    if (!navigator.geolocation) {
      fetchMarmitarias()
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchMarmitarias(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        // Permissão negada ou erro — listar todas sem filtro
        toast('Ative a localização para ver marmitarias próximas', {
          icon: '📍',
        })
        fetchMarmitarias()
      },
      { timeout: 5000 }
    )
  }, [])

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

      {loading ? (
        <div data-testid="skeleton-marmitarias">
          <LoadingSkeleton variant="card" count={6} />
        </div>
      ) : !marmitarias || marmitarias.length === 0 ? (
        <EmptyState
          icon={<ChefHat className="h-8 w-8" />}
          title="Nenhuma marmitaria parceira disponível no momento."
          description="Volte em breve — novas marmitarias são cadastradas frequentemente."
        />
      ) : (
        <div
          data-testid="patrocinar-marmitarias-list"
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          {marmitarias.map((m) => (
            <MarmitariaCard
              key={m.id}
              id={m.id}
              name={m.tradeName ?? m.name}
              photo={m.photo ?? undefined}
              address={
                m.address ??
                [m.neighborhood, m.city].filter(Boolean).join(', ') ||
                undefined
              }
              pricePerMeal={Number(m.pricePerMeal ?? 0)}
              rating={m.rating ?? undefined}
              distance={
                m.distance != null ? `${m.distance} km` : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
