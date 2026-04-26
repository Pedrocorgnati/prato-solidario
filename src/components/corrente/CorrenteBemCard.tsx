"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface CorrenteBemCardProps {
  refeicoesHoje: number
  refeicoesEsteMes: number
  refeicoesTotais: number
  hasError?: boolean
  loading?: boolean
  shareButtonSlot?: React.ReactNode
  className?: string
}

interface CounterItemProps {
  value: number
  label: string
  emoji: string
  loading?: boolean
  hasError?: boolean
}

function CounterItem({ value, label, emoji, loading, hasError }: CounterItemProps) {
  const [display, setDisplay] = React.useState(0)
  const ref = React.useRef<HTMLDivElement>(null)
  const animated = React.useRef(false)

  React.useEffect(() => {
    if (animated.current || hasError) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          animated.current = true
          observer.disconnect()

          const duration = 2000
          const start = performance.now()
          const frame = (time: number) => {
            const elapsed = time - start
            const progress = Math.min(elapsed / duration, 1)
            // easeOutCubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(Math.floor(eased * value))
            if (progress < 1) requestAnimationFrame(frame)
            else setDisplay(value)
          }
          requestAnimationFrame(frame)
        }
      },
      { threshold: 0.2 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, hasError])

  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-1 text-center"
      aria-live="polite"
      aria-atomic="true"
    >
      {loading ? (
        <>
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </>
      ) : (
        <>
          <span
            className="text-2xl font-extrabold text-green-700 dark:text-emerald-400 tabular-nums"
            aria-label={hasError ? `${label}: dados indisponíveis` : `${value} ${label}`}
          >
            <span role="img" aria-label={label}>
              {emoji}
            </span>{" "}
            {hasError
              ? "–"
              : value === 0 && label.includes("hoje")
                ? <span className="text-sm font-semibold text-green-600 dark:text-emerald-500">Seja o primeiro hoje!</span>
                : display.toLocaleString("pt-BR")}
          </span>
          <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
        </>
      )}
    </div>
  )
}

export function CorrenteBemCard({
  refeicoesHoje,
  refeicoesEsteMes,
  refeicoesTotais,
  hasError = false,
  loading = false,
  shareButtonSlot,
  className,
}: CorrenteBemCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md mx-auto rounded-2xl p-6",
        "bg-gradient-to-br from-green-50 to-emerald-50",
        "dark:from-green-950/30 dark:to-emerald-950/30",
        "border border-green-200 dark:border-green-800",
        "shadow-sm",
        className
      )}
      data-testid="corrente-bem-card"
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-3 mb-6 text-center">
        <h2 className="text-xl font-semibold text-green-700 dark:text-emerald-300">
          <span role="img" aria-label="semente">🌱</span> Você fez parte da Corrente do Bem!
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-xs">
          Cada refeição compartilhada constrói uma corrente de solidariedade.
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <CounterItem
          value={refeicoesHoje}
          label="refeições hoje"
          emoji="🍽️"
          loading={loading}
          hasError={hasError}
        />
        <CounterItem
          value={refeicoesEsteMes}
          label="este mês"
          emoji="📅"
          loading={loading}
          hasError={hasError}
        />
        <CounterItem
          value={refeicoesTotais}
          label="no total"
          emoji="🌍"
          loading={loading}
          hasError={hasError}
        />
      </div>

      {/* Hashtag */}
      <div className="text-center mb-4">
        <span className="text-base font-bold text-green-600 dark:text-emerald-400">
          #PratoSolidário
        </span>
      </div>

      {/* Share Button slot */}
      {shareButtonSlot && (
        <div className="mt-4">{shareButtonSlot}</div>
      )}
    </div>
  )
}
