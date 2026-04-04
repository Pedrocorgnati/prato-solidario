"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ImpactCounterProps {
  value: number
  label: string
  suffix?: string
  className?: string
}

function useCountUp(target: number, duration: number = 1500) {
  const [current, setCurrent] = React.useState(0)

  React.useEffect(() => {
    const start = performance.now()
    const frame = (time: number) => {
      const elapsed = time - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(frame)
      else setCurrent(target)
    }
    requestAnimationFrame(frame)
  }, [target, duration])

  return current
}

export function ImpactCounter({ value, label, suffix = "", className }: ImpactCounterProps) {
  const count = useCountUp(value)

  return (
    <div className={cn("flex flex-col items-center gap-1 text-center", className)}>
      <span className="animate-count-up text-4xl font-extrabold text-[var(--color-primary-raw)] md:text-5xl">
        {count.toLocaleString("pt-BR")}
        {suffix}
      </span>
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
    </div>
  )
}
