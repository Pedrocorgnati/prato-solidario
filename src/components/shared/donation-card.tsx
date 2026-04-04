"use client"

import * as React from "react"
import { Clock, MapPin, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DonationStatus } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface DonationCardProps {
  id: string
  title: string
  donorName: string
  address: string
  servings: number
  status: DonationStatus
  windowEnd?: string
  distance?: string
  onRequest?: (id: string) => void
  className?: string
}

const statusConfig: Record<DonationStatus, { label: string; variant: string }> = {
  [DonationStatus.DISPONIVEL]: { label: "Disponível", variant: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20" },
  [DonationStatus.URGENTE]: { label: "Urgente!", variant: "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20" },
  [DonationStatus.ESGOTADA]: { label: "Esgotada", variant: "bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] border-[var(--color-border-raw)]" },
  [DonationStatus.EXPIRADA]: { label: "Expirada", variant: "bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] border-[var(--color-border-raw)]" },
}

export function DonationCard({
  id,
  title,
  donorName,
  address,
  servings,
  status,
  windowEnd,
  distance,
  onRequest,
  className,
}: DonationCardProps) {
  const config = statusConfig[status]
  const isUrgent = status === DonationStatus.URGENTE
  const isAvailable = status === DonationStatus.DISPONIVEL || status === DonationStatus.URGENTE

  return (
    <div
      data-testid={`donation-card-${id}`}
      className={cn(
        "rounded-lg border bg-[var(--color-background-raw)] p-4 shadow-sm transition-shadow hover:shadow-md",
        isUrgent ? "border-[var(--color-secondary-raw)]" : "border-[var(--color-border-raw)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                config.variant
              )}
            >
              {config.label}
            </span>
            {distance && (
              <span className="text-xs text-[var(--color-text-muted)]">{distance}</span>
            )}
          </div>
          <h3 className="font-semibold text-[var(--color-text-primary)] truncate">{title}</h3>
          <p className="text-sm text-[var(--color-text-secondary)] truncate">{donorName}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{address}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>{servings} {servings === 1 ? "porção" : "porções"}</span>
          </div>
          {windowEnd && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Até {windowEnd}</span>
            </div>
          )}
        </div>
      </div>

      {isAvailable && onRequest && (
        <Button
          data-testid={`donation-card-request-button-${id}`}
          variant={isUrgent ? "secondary" : "default"}
          size="md"
          className="mt-4 w-full"
          onClick={() => onRequest(id)}
        >
          Solicitar refeição
        </Button>
      )}
    </div>
  )
}
