'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface MetricCardProps {
  icon: React.ReactNode
  value: number
  label: string
  unit?: string
  trend?: number
  isShould?: boolean
  animationDuration?: number
}

export function MetricCard({
  icon,
  value,
  label,
  unit = '',
  trend,
  isShould = false,
  animationDuration = 1500,
}: MetricCardProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [displayValue, setDisplayValue] = useState(() => {
    if (value === 0 || prefersReducedMotion) return value
    return 0
  })

  useEffect(() => {
    // Respeitar prefers-reduced-motion
    if (value === 0 || prefersReducedMotion) {
      return
    }

    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / animationDuration, 1)
      // easing ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.floor(eased * value))
      if (progress < 1) {
        requestAnimationFrame(tick)
      } else {
        setDisplayValue(value)
      }
    }

    const frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, animationDuration, prefersReducedMotion])
  const shownValue = value === 0 || prefersReducedMotion ? value : displayValue

  return (
    <Card className="text-center p-6 transition-shadow duration-150 hover:shadow-md">
      <CardContent className="pt-0 space-y-1">
        <div className="text-4xl mb-3 flex justify-center text-[var(--color-primary-raw)]" aria-hidden="true">
          {icon}
        </div>
        <div
          className="text-3xl font-bold text-[var(--color-text-primary)]"
          aria-label={`${value.toLocaleString('pt-BR')} ${label}`}
        >
          {shownValue.toLocaleString('pt-BR')}
          {unit && (
            <span className="text-lg font-normal text-[var(--color-text-secondary)] ml-1">
              {unit}
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">{label}</p>
        {trend !== undefined && trend > 0 && (
          <p
            className="text-xs text-green-600 mt-1 font-medium"
            aria-label={`Tendencia: +${trend}% vs periodo anterior`}
          >
            ↑ +{trend.toFixed(1)}%
          </p>
        )}
        {isShould && value === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1 italic">
            Em breve
          </p>
        )}
      </CardContent>
    </Card>
  )
}
