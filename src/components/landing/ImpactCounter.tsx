"use client"

import * as React from "react"
import type { ImpactMetrics } from "@/types/metrics"
import { formatNumber } from "@/utils/formatters"

/**
 * ImpactCounter — exibe métricas de impacto animadas.
 * Busca dados de /api/v1/metrics/public, anima contagem ao entrar na viewport.
 * Client Component (IntersectionObserver + useState).
 * @see module-18-landing-page/TASK-2/ST002
 * @see module-19-metricas-impacto — expansão futura
 */

const REFETCH_INTERVAL_MS = 5 * 60 * 1000 // 5min
const ANIMATION_DURATION_MS = 1500

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return reduced
}

function useCountUp(target: number, enabled: boolean, skipAnimation: boolean): number {
  const [current, setCurrent] = React.useState(0)

  React.useEffect(() => {
    if (!enabled) return
    if (skipAnimation) {
      setCurrent(target)
      return
    }
    const start = performance.now()
    let raf: number
    const frame = (time: number) => {
      const elapsed = time - start
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.floor(eased * target))
      if (progress < 1) {
        raf = requestAnimationFrame(frame)
      } else {
        setCurrent(target)
      }
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [target, enabled, skipAnimation])

  return current
}

interface CounterItemProps {
  value: number
  label: string
  animEnabled: boolean
  skipAnimation: boolean
}

function CounterItem({ value, label, animEnabled, skipAnimation }: CounterItemProps) {
  const count = useCountUp(value, animEnabled, skipAnimation)
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-4xl font-extrabold text-green-700 md:text-5xl">
        {formatNumber(count)}
      </span>
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
    </div>
  )
}

export function ImpactCounter() {
  const [data, setData] = React.useState<ImpactMetrics | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [animEnabled, setAnimEnabled] = React.useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const ref = React.useRef<HTMLDivElement>(null)

  // Fetch data
  const fetchData = React.useCallback(() => {
    fetch("/api/v1/metrics/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ImpactMetrics | null) => {
        setData(d ?? { totalRefeicoes: 0, doacoesAtivas: 0, marmitariasParceiras: 0, updatedAt: null })
      })
      .catch(() => {
        setData({ totalRefeicoes: 0, doacoesAtivas: 0, marmitariasParceiras: 0, updatedAt: null })
      })
      .finally(() => setIsLoading(false))
  }, [])

  React.useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFETCH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  // Intersection Observer — anima só quando visível
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimEnabled(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (isLoading) {
    return (
      <section
        data-testid="landing-impact-counter-loading"
        className="py-12 bg-[var(--color-background-raw)]"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-12 w-28 animate-pulse rounded bg-green-200" />
                <div className="h-4 w-36 animate-pulse rounded bg-green-100" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const metrics = data ?? { totalRefeicoes: 0, doacoesAtivas: 0, marmitariasParceiras: 0, updatedAt: null }

  return (
    <section
      ref={ref}
      data-testid="landing-impact-counter"
      aria-live="polite"
      aria-atomic="false"
      className="py-12 bg-[var(--color-background-raw)]"
    >
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-xl font-bold text-[var(--color-text-primary)] mb-8">
          Nosso impacto em tempo real
        </h2>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          <CounterItem
            value={metrics.totalRefeicoes}
            label="Refeições distribuídas"
            animEnabled={animEnabled}
            skipAnimation={reducedMotion}
          />
          <CounterItem
            value={metrics.doacoesAtivas}
            label="Doações ativas hoje"
            animEnabled={animEnabled}
            skipAnimation={reducedMotion}
          />
          <CounterItem
            value={metrics.marmitariasParceiras}
            label="Marmitarias parceiras"
            animEnabled={animEnabled}
            skipAnimation={reducedMotion}
          />
        </div>
      </div>
    </section>
  )
}
