/**
 * BadgeCard — exibe um badge conquistado ou pendente.
 *
 * earned=true  → ícone colorido, data de conquista
 * earned=false → ícone em grayscale, opacidade 50%
 *
 * Acessibilidade: aria-label descritivo para screen readers.
 *
 * @see module-20-gamificacao/TASK-3/ST002
 */

import { BadgeType } from '@/types/enums'

// Labels e descrições dos critérios para cada badge
export const BADGE_META: Record<
  BadgeType,
  { label: string; description: string; icon: string }
> = {
  [BadgeType.PRIMEIRA_DOACAO]: {
    label: 'Primeiro Passo',
    description: 'Fez sua primeira doação confirmada',
    icon: '🌱',
  },
  [BadgeType.DOADOR_FREQUENTE]: {
    label: 'Doador Frequente',
    description: '4 ou mais doações em um único mês',
    icon: '🔥',
  },
  [BadgeType.HEROI_DO_MES]: {
    label: 'Herói do Mês',
    description: 'Entre os top 3 doadores do mês',
    icon: '⭐',
  },
  [BadgeType.CENTURIAO]: {
    label: 'Centurião',
    description: '100 refeições doadas ao longo do tempo',
    icon: '💯',
  },
  [BadgeType.MESTRE]: {
    label: 'Mestre Solidário',
    description: '500 refeições doadas ao longo do tempo',
    icon: '🏆',
  },
}

interface BadgeCardProps {
  badge: BadgeType
  earned: boolean
  earnedAt?: Date | null
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function BadgeCard({ badge, earned, earnedAt }: BadgeCardProps) {
  const meta = BADGE_META[badge]

  const ariaLabel = earned
    ? `Badge: ${meta.label} — conquistado em ${earnedAt ? formatMonth(earnedAt) : 'data desconhecida'}`
    : `Badge: ${meta.label} — ainda não conquistado`

  return (
    <div
      role="listitem"
      aria-label={ariaLabel}
      title={meta.description}
      className={`relative rounded-xl border p-4 text-center space-y-2 transition-all duration-200 cursor-default
        hover:scale-105
        ${
          earned
            ? 'border-[var(--color-primary-raw)]/30 bg-[var(--color-primary-raw)]/5'
            : 'border-[var(--color-border-raw)] bg-[var(--color-muted-raw)] opacity-50 grayscale'
        }`}
    >
      <span className="text-3xl" aria-hidden="true">
        {meta.icon}
      </span>
      <p className="font-semibold text-sm text-[var(--color-text-primary)] leading-tight">
        {meta.label}
      </p>
      <p className="text-xs text-[var(--color-text-muted)] leading-snug">
        {meta.description}
      </p>
      {earned && earnedAt && (
        <p className="text-xs text-[var(--color-success)] font-medium">
          {formatMonth(earnedAt)}
        </p>
      )}
    </div>
  )
}

export function BadgeCardSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-border-raw)] p-4 space-y-2 animate-pulse">
      <div className="h-8 w-8 bg-[var(--color-muted-raw)] rounded mx-auto" />
      <div className="h-3.5 bg-[var(--color-muted-raw)] rounded w-3/4 mx-auto" />
      <div className="h-3 bg-[var(--color-muted-raw)] rounded w-full mx-auto" />
    </div>
  )
}
