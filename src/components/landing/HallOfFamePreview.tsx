import Link from "next/link"
import { Trophy } from "lucide-react"
import { ROUTES } from "@/lib/constants"

/**
 * HallOfFamePreview — exibe top 3 doadores do mês na landing page.
 * Server Component com fetch ISR (15min).
 * @see intake-review/TASK-14/ST005
 */

interface TopDonorEntry {
  rank: number
  displayName: string
  avatarUrl: string | null
  totalMeals: number
}

async function fetchTop3(): Promise<TopDonorEntry[]> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const url = `${base}/api/v1/gamification/badges?month=${month}&year=${year}&limit=3`

    const res = await fetch(url, {
      next: { revalidate: 900 }, // 15 min ISR
    })

    if (!res.ok) return []
    const data = await res.json()
    return (data?.topMonth ?? []).slice(0, 3)
  } catch {
    return []
  }
}

const RANK_MEDALS = ['🥇', '🥈', '🥉']

export async function HallOfFamePreview() {
  const top3 = await fetchTop3()

  if (top3.length === 0) return null

  return (
    <section
      data-testid="landing-hall-of-fame-preview"
      className="py-12 bg-[var(--color-background-raw)]"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" aria-hidden="true" />
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              Hall da Fama — Heróis do Mês
            </h2>
          </div>
          <Link
            href={ROUTES.HALL_DA_FAMA}
            data-testid="landing-hall-of-fame-ver-todos-link"
            className="text-sm font-medium text-green-700 hover:text-green-800 hover:underline underline-offset-2 transition-colors"
          >
            Ver todos →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {top3.map((donor, idx) => (
            <div
              key={donor.rank}
              className="flex items-center gap-3 rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-surface)] px-4 py-3"
            >
              <span className="text-2xl" aria-label={`${idx + 1}º lugar`}>
                {RANK_MEDALS[idx] ?? `#${donor.rank}`}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                  {donor.displayName}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {donor.totalMeals} refeições doadas
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
