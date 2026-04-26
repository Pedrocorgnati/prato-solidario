/**
 * HallOfFameCard — card de doador no ranking do Hall da Fama.
 *
 * Props:
 *   rank         - posição no ranking (1, 2, 3 recebem medalha; demais: número simples)
 *   displayName  - nome anonimizado ("João S." ou nome fantasia)
 *   avatarUrl    - URL do avatar (fallback: iniciais)
 *   totalMeals   - total de refeições doadas no período
 *   isHero       - destaque para o top 1 (Herói do Mês)
 *
 * Acessibilidade: role="listitem", aria-label descritivo.
 *
 * @see module-20-gamificacao/TASK-2/ST003
 */

import Image from 'next/image'

interface HallOfFameCardProps {
  rank: number
  displayName: string
  avatarUrl?: string | null
  totalMeals: number
  isHero?: boolean
}

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span aria-hidden="true" className="text-2xl">🥇</span>
  if (rank === 2) return <span aria-hidden="true" className="text-2xl">🥈</span>
  if (rank === 3) return <span aria-hidden="true" className="text-2xl">🥉</span>
  return (
    <span className="text-sm font-bold text-[var(--color-text-muted)] w-7 text-center">
      {rank}
    </span>
  )
}

function AvatarFallback({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className="w-10 h-10 rounded-full bg-[var(--color-primary-raw)]/20 flex items-center justify-center text-sm font-bold text-[var(--color-primary)] shrink-0"
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

export function HallOfFameCard({
  rank,
  displayName,
  avatarUrl,
  totalMeals,
  isHero = false,
}: HallOfFameCardProps) {
  return (
    <div
      role="listitem"
      aria-label={`Posição ${rank}: ${displayName} — ${totalMeals} refeições doadas`}
      className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
        isHero
          ? 'border-amber-400/50 bg-amber-50/30 dark:bg-amber-900/10 shadow-sm'
          : 'border-[var(--color-border-raw)] bg-[var(--color-surface-raw)] hover:border-[var(--color-primary-raw)]/30'
      } animate-fade-in`}
    >
      {/* Medalha / posição */}
      <div className="w-8 flex items-center justify-center shrink-0">
        <MedalIcon rank={rank} />
      </div>

      {/* Avatar */}
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          aria-hidden="true"
          width={40}
          height={40}
          className="rounded-full object-cover shrink-0"
        />
      ) : (
        <AvatarFallback name={displayName} />
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
          {displayName}
          {isHero && (
            <span className="ml-1.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full px-1.5 py-0.5 font-medium">
              Herói
            </span>
          )}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {totalMeals.toLocaleString('pt-BR')} refeições
        </p>
      </div>
    </div>
  )
}

/** Skeleton de loading para HallOfFameCard */
export function HallOfFameCardSkeleton() {
  return (
    <div
      role="listitem"
      aria-busy="true"
      className="flex items-center gap-3 rounded-xl border border-[var(--color-border-raw)] p-3 animate-pulse"
    >
      <div className="w-8 h-6 bg-[var(--color-muted-raw)] rounded" />
      <div className="w-10 h-10 bg-[var(--color-muted-raw)] rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-[var(--color-muted-raw)] rounded w-3/4" />
        <div className="h-3 bg-[var(--color-muted-raw)] rounded w-1/2" />
      </div>
    </div>
  )
}
