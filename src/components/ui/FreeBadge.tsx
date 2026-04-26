/**
 * FreeBadge — badge "100% gratuito" para reforçar proposta de valor.
 * @see intake-review/TASK-19/ST004
 */
interface FreeBadgeProps {
  className?: string
  showText?: boolean
}

export function FreeBadge({ className, showText = true }: FreeBadgeProps) {
  return (
    <span
      data-testid="free-badge"
      aria-label="Serviço 100% gratuito"
      className={`inline-flex items-center gap-1 rounded-full bg-green-100 border border-green-300 px-2.5 py-0.5 text-xs font-semibold text-green-800 ${className ?? ''}`}
    >
      <svg
        className="h-3 w-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {showText && '100% gratuito'}
    </span>
  )
}
