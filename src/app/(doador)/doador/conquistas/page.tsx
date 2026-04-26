/**
 * Página de Conquistas do Doador — badges, progresso, diplomas e opt-in de privacidade.
 *
 * Server Component autenticado (rota (doador)).
 * Carrega badges via GamificationService. Seção de diplomas via DiplomasSection (TASK-4).
 *
 * @see module-20-gamificacao/TASK-3/ST001
 */

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/session'
import { gamificationService } from '@/services/gamification.service'
import { prisma } from '@/lib/prisma'
import { BadgeCard, BadgeCardSkeleton } from '@/components/gamification/BadgeCard'
import { BadgeProgressBar } from '@/components/gamification/BadgeProgressBar'
import { PrivacyToggle } from '@/components/gamification/PrivacyToggle'
import { DiplomasSection } from '@/components/gamification/DiplomasSection'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export const metadata: Metadata = {
  title: 'Conquistas — Prato Solidário',
}

async function ConquistasContent({ userId }: { userId: string }) {
  const [badgesWithProgress, user] = await Promise.all([
    gamificationService.getBadgesWithProgress(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { hallOfFame: true },
    }),
  ])

  const earned = badgesWithProgress.filter((b) => b.earned)
  const pending = badgesWithProgress.filter((b) => !b.earned)

  return (
    <div className="space-y-8">
      {/* Badges conquistados */}
      <section aria-labelledby="conquistados-heading">
        <h2 id="conquistados-heading" className="text-base font-semibold text-[var(--color-text-primary)] mb-3">
          Minhas Conquistas
        </h2>

        {earned.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-border-raw)] p-6 text-center space-y-2">
            <p className="text-2xl">🌱</p>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Continue contribuindo para ganhar seu primeiro badge!
            </p>
            <Link
              href="/doador/historico"
              className="inline-block text-xs text-[var(--color-primary)] underline underline-offset-2"
            >
              Ver minhas doações
            </Link>
          </div>
        ) : (
          <div role="list" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {earned.map((b) => (
              <BadgeCard key={b.type} badge={b.type} earned earnedAt={b.earnedAt} />
            ))}
          </div>
        )}
      </section>

      {/* Progresso — badges pendentes */}
      {pending.length > 0 && (
        <section aria-labelledby="proximos-heading">
          <h2 id="proximos-heading" className="text-base font-semibold text-[var(--color-text-primary)] mb-3">
            Próximas Conquistas
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pending.map((b) => (
              <div key={b.type} className="rounded-xl border border-[var(--color-border-raw)] p-3 space-y-2">
                <BadgeCard badge={b.type} earned={false} />
                {b.target > 1 && (
                  <BadgeProgressBar
                    badgeType={b.type}
                    current={b.current}
                    target={b.target}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Link para Hall da Fama */}
      <Link
        href="/hall-da-fama"
        className="flex items-center gap-2 rounded-xl border border-[var(--color-primary-raw)]/30 bg-[var(--color-primary-raw)]/5 px-4 py-3 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-raw)]/10 transition-colors"
      >
        🏆 Ver Hall da Fama →
      </Link>

      {/* Diplomas */}
      <section aria-labelledby="diplomas-heading">
        <h2 id="diplomas-heading" className="text-base font-semibold text-[var(--color-text-primary)] mb-3">
          Meus Diplomas
        </h2>
        <Suspense fallback={<DiplomasSkeleton />}>
          <DiplomasSection userId={userId} />
        </Suspense>
      </section>

      {/* Hall da Fama opt-in */}
      <section aria-labelledby="privacy-heading">
        <h2 id="privacy-heading" className="text-base font-semibold text-[var(--color-text-primary)] mb-3">
          Privacidade
        </h2>
        <PrivacyToggle initialEnabled={user?.hallOfFame ?? false} />
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          Ao ativar, seu nome aparece anonimizado no{' '}
          <Link href="/hall-da-fama" className="underline underline-offset-2">
            Hall da Fama público
          </Link>
          .
        </p>
      </section>
    </div>
  )
}

function ConquistasSkeleton() {
  return (
    <div className="space-y-8">
      <section>
        <div className="h-4 bg-[var(--color-muted-raw)] rounded w-36 mb-3 animate-pulse" />
        <div role="list" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => <BadgeCardSkeleton key={i} />)}
        </div>
      </section>
    </div>
  )
}

function DiplomasSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[0, 1].map((i) => (
        <div key={i} className="h-12 bg-[var(--color-muted-raw)] rounded-xl" />
      ))}
    </div>
  )
}

export default async function ConquistasPage() {
  const session = await requireRole(['DOADOR_PF', 'DOADOR_RESTAURANTE', 'ONG'])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Minhas Conquistas</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Badges, diplomas e seu impacto na comunidade.
        </p>
      </header>

      <ErrorBoundary
        fallback={
          <div role="alert" className="rounded-xl border border-[var(--color-border-raw)] p-6 text-center space-y-2">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Não foi possível carregar suas conquistas.
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Tente recarregar a página.
            </p>
          </div>
        }
      >
        <Suspense fallback={<ConquistasSkeleton />}>
          <ConquistasContent userId={session.id} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
