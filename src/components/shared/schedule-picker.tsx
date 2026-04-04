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

export function SchedulePicker({
  startValue = "",
  endValue = "",
  onStartChange,
  onEndChange,
  error,
  className,
}: SchedulePickerProps) {
  const duration =
    startValue && endValue
      ? timeToMinutes(endValue) - timeToMinutes(startValue)
      : null

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Início</Label>
          <Input
            type="text"
            placeholder="00:00"
            value={startValue}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d:]/g, "")
              onStartChange?.(v)
            }}
            maxLength={5}
            inputMode="numeric"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">Fim</Label>
          <Input
            type="text"
            placeholder="00:00"
            value={endValue}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d:]/g, "")
              onEndChange?.(v)
            }}
            maxLength={5}
            inputMode="numeric"
          />
        </div>
      </div>
      {duration !== null && duration > 0 && (
        <p className="text-xs text-[var(--color-text-muted)]">
          Duração: {formatDuration(duration)}
        </p>
      )}
      {error && (
        <p className="text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
