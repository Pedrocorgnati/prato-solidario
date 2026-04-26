/**
 * BadgeProgressBar — barra de progresso para badges cumulativos e mensais.
 *
 * Exibido para badges não conquistados para mostrar o progresso até o próximo badge.
 * Acessibilidade: role="progressbar" com aria-valuenow/min/max.
 *
 * @see module-20-gamificacao/TASK-3/ST003
 */

import { BadgeType } from '@/types/enums'
import { BADGE_META } from './BadgeCard'

interface BadgeProgressBarProps {
  badgeType: BadgeType
  current: number
  target: number
  label?: string
}

export function BadgeProgressBar({
  badgeType,
  current,
  target,
  label,
}: BadgeProgressBarProps) {
  const meta = BADGE_META[badgeType]
  const pct = Math.min(Math.round((current / target) * 100), 100)
  const displayLabel = label ?? meta.label

  let progressText: string
  switch (badgeType) {
    case BadgeType.CENTURIAO:
      progressText = `${current} / ${target} refeições para ${displayLabel}`
      break
    case BadgeType.MESTRE:
      progressText = `${current} / ${target} refeições para ${displayLabel}`
      break
    case BadgeType.DOADOR_FREQUENTE:
      progressText = `${current} de ${target} doações este mês`
      break
    case BadgeType.HEROI_DO_MES:
      progressText = current > 0 ? `Você está em ${current}º lugar este mês` : 'Continue doando para entrar no ranking!'
      break
    default:
      progressText = `${current} / ${target}`
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[var(--color-text-muted)] truncate">{progressText}</span>
        <span className="text-xs font-medium text-[var(--color-text-primary)] shrink-0">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label={progressText}
        className="h-2 rounded-full bg-[var(--color-muted-raw)] overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
