/**
 * Hall da Fama — página pública com os maiores doadores do mês e all-time.
 *
 * Server Component público (sem autenticação).
 * Exibe apenas doadores com hallOfFame: true (opt-in de privacidade).
 * Nomes anonimizados via API.
 *
 * @see module-20-gamificacao/TASK-2/ST002
 */

import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { HallOfFameCard, HallOfFameCardSkeleton } from '@/components/gamification/HallOfFameCard'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function generateMetadata(): Metadata {
  const now = new Date()
  const monthName = MONTH_NAMES[now.getMonth()]
  return {
    title: 'Hall da Fama | Prato Solidário',
    description: `Os maiores doadores de ${monthName} e de todos os tempos da rede Prato Solidário.`,
    alternates: { canonical: '/hall-da-fama' },
    openGraph: {
      title: 'Hall da Fama | Prato Solidário',
      description: 'Conheça os heróis solidários que mais ajudaram a distribuir refeições.',
    },
  }
}

export const dynamic = 'force-dynamic'

interface TopDonorEntry {
  rank: number
  displayName: string
  avatarUrl: string | null
  totalMeals: number
}

async function fetchRankings(month: number, year: number) {
  // Fetch interno — server-side, sem rate limit de IP
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const url = `${base}/api/v1/gamification/badges?month=${month}&year=${year}&limit=10`

  const res = await fetch(url, {
    next: { revalidate: 900 }, // 15 min de cache ISR
  })

  if (!res.ok) return null

  return res.json() as Promise<{
    topMonth: TopDonorEntry[]
    topAllTime: TopDonorEntry[]
  }>
}

async function HallContent() {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const data = await fetchRankings(month, year)

  if (!data) {
    return (
      <div className="text-center py-12 text-[var(--color-text-muted)]">
        <p className="text-base mb-3">Não foi possível carregar o Hall da Fama agora.</p>
        <Link
          href="/hall-da-fama"
          className="text-sm text-[var(--color-primary)] underline underline-offset-2"
        >
          Tentar novamente
        </Link>
      </div>
    )
  }

  const monthName = MONTH_NAMES[month - 1]
  const hero = data.topMonth[0] ?? null

  return (
    <div className="space-y-8">
      {/* Herói do Mês */}
      {hero ? (
        <section aria-labelledby="heroi-heading">
          <h2 id="heroi-heading" className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
            ⭐ Herói de {monthName}
          </h2>
          <HallOfFameCard
            rank={hero.rank}
            displayName={hero.displayName}
            avatarUrl={hero.avatarUrl}
            totalMeals={hero.totalMeals}
            isHero
          />
        </section>
      ) : null}

      {/* Top 10 do Mês */}
      <section aria-labelledby="mes-heading">
        <h2 id="mes-heading" className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
          🏅 Top 10 — {monthName} {year}
        </h2>
        {data.topMonth.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">
            Sem destaques ainda. Seja o primeiro a fazer a diferença!
          </p>
        ) : (
          <div role="list" className="space-y-2">
            {data.topMonth.map((d) => (
              <HallOfFameCard key={`month-${d.rank}`} {...d} isHero={d.rank === 1} />
            ))}
          </div>
        )}
      </section>

      {/* Top 10 All-Time */}
      <section aria-labelledby="alltime-heading">
        <h2 id="alltime-heading" className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
          🏆 Top 10 — Todos os Tempos
        </h2>
        {data.topAllTime.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] py-4 text-center">
            Ainda não há destaques. Seja o primeiro a fazer a diferença!
          </p>
        ) : (
          <div role="list" className="space-y-2">
            {data.topAllTime.map((d) => (
              <HallOfFameCard key={`alltime-${d.rank}`} {...d} />
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-[var(--color-text-muted)] text-center">
        Apenas doadores que optaram por aparecer publicamente são exibidos.{' '}
        <Link href="/doador/conquistas" className="underline underline-offset-2">
          Ative nas suas conquistas.
        </Link>
      </p>
    </div>
  )
}

function HallSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      {[0, 1].map((section) => (
        <section key={section}>
          <div className="h-5 bg-[var(--color-muted-raw)] rounded w-48 mb-3 animate-pulse" />
          <div role="list" className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <HallOfFameCardSkeleton key={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default function HallDaFamaPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Hall da Fama</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Reconhecendo quem faz a diferença na nossa comunidade solidária.
        </p>
      </header>

      <Suspense fallback={<HallSkeleton />}>
        <HallContent />
      </Suspense>
    </main>
  )
}
