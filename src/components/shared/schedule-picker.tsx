"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SchedulePickerProps {
  startValue?: string
  endValue?: string
  onStartChange?: (value: string) => void
  onEndChange?: (value: string) => void
  error?: string
  name?: string
  className?: string
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m}min`
}

const MIN_INTERVAL_MINUTES = 30

export const SchedulePicker = React.forwardRef<HTMLInputElement, SchedulePickerProps>(
  function SchedulePicker(
    {
      startValue = "",
      endValue = "",
      onStartChange,
      onEndChange,
      error,
      name,
      className,
    },
    ref
  ) {
    const duration =
      startValue && endValue
        ? timeToMinutes(endValue) - timeToMinutes(startValue)
        : null

    const intervalError =
      duration !== null && duration > 0 && duration < MIN_INTERVAL_MINUTES
        ? "Intervalo mínimo de 30 minutos"
        : ""

    const displayError = error || intervalError

    return (
      <div className={cn("space-y-3", className)}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Início</Label>
            <Input
              ref={ref}
              name={name ? `${name}.start` : undefined}
              type="time"
              value={startValue}
              onChange={(e) => onStartChange?.(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Fim</Label>
            <Input
              name={name ? `${name}.end` : undefined}
              type="time"
              value={endValue}
              onChange={(e) => onEndChange?.(e.target.value)}
            />
          </div>
        </div>
        {duration !== null && duration >= MIN_INTERVAL_MINUTES && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Duração: {formatDuration(duration)}
          </p>
        )}
        {displayError && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">
            {displayError}
          </p>
        )}
      </div>
    )
  }
)
