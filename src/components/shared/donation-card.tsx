"use client"

import * as React from "react"
import { Clock, MapPin, Users, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DonationStatus } from "@/types/enums"
import { cn } from "@/lib/utils"

interface DonationCardProps {
  id: string
  /** Prisma shape */
  description?: string
  /** Legacy shape (receptor page) */
  title?: string
  donorName?: string
  /** Prisma shape */
  portions?: number
  /** Legacy shape */
  servings?: number
  status: string // Prisma DonationStatus or legacy DonationStatus
  windowStart?: Date | string
  windowEnd?: Date | string
  radiusKm?: number
  distanceKm?: number
  /** API /donations/available shape (privacy-safe) — shown as "Bairro X - ~Y km" */
  bairro?: string
  /** Legacy shape — full address (only shown when available, e.g. after code generation) */
  address?: string
  /** Legacy shape */
  distance?: string
  onCancel?: (id: string) => void
  onRequest?: (id: string) => void
  /** Badge "Mais próximo" — destaca a doação mais perto do receptor */
  isClosest?: boolean
  className?: string
}

// RESOLVED: LegacyDonationStatus removido — strings literais PT-BR mapeadas para enum Prisma
/** Map legacy PT status values to Prisma EN values */
const legacyStatusMap: Record<string, string> = {
  'DISPONIVEL': DonationStatus.AVAILABLE,
  'URGENTE': DonationStatus.AVAILABLE,
  'ESGOTADA': DonationStatus.COMPLETED,
  'EXPIRADA': DonationStatus.EXPIRED,
}

const statusConfig: Record<string, { label: string; variant: string }> = {
  [DonationStatus.AVAILABLE]: {
    label: "Disponível",
    variant:
      "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20",
  },
  [DonationStatus.PENDING]: {
    label: "Reservado",
    variant:
      "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20",
  },
  [DonationStatus.RESERVED]: {
    label: "Reservado",
    variant:
      "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20",
  },
  [DonationStatus.COMPLETED]: {
    label: "Confirmado",
    variant:
      "bg-[var(--color-info)]/10 text-[var(--color-info)] border-[var(--color-info)]/20",
  },
  [DonationStatus.CANCELLED]: {
    label: "Cancelado",
    variant:
      "bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] border-[var(--color-border-raw)]",
  },
  [DonationStatus.EXPIRED]: {
    label: "Expirado",
    variant:
      "bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20",
  },
}

function formatTime(date?: Date | string): string | null {
  if (!date) return null
  if (typeof date === "string") {
    // Legacy: plain time string like "14:00" — return as-is
    if (/^\d{1,2}:\d{2}$/.test(date)) return date
    const d = new Date(date)
    if (isNaN(d.getTime())) return null
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  }
  if (isNaN(date.getTime())) return null
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export function DonationCard({
  id,
  description,
  title,
  donorName,
  portions,
  servings,
  status: rawStatus,
  windowStart,
  windowEnd,
  radiusKm,
  distanceKm,
  bairro,
  address,
  distance,
  onCancel,
  onRequest,
  isClosest = false,
  className,
}: DonationCardProps) {
  // Normalize legacy status → Prisma status
  const status = legacyStatusMap[rawStatus] ?? rawStatus

  const config = statusConfig[status] ?? {
    label: status,
    variant:
      "bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] border-[var(--color-border-raw)]",
  }
  const isAvailable = status === DonationStatus.AVAILABLE
  const isCancellable =
    status === DonationStatus.AVAILABLE || status === DonationStatus.PENDING

  // Backward compat: resolve legacy vs new props
  const displayTitle = description ?? title ?? "Doação"
  const displayPortions = portions ?? servings ?? 0
  const windowEndFormatted = formatTime(windowEnd)
  const distanceLabel =
    distanceKm != null ? `${distanceKm.toFixed(1)} km` : distance ?? null

  // CL-181: localização mascarada — bairro + distância aproximada (sem endereço completo)
  // Se `bairro` presente e sem endereço completo: exibir "Bairro X - ~Y km"
  // Se `address` presente (pós-geração de código): exibir endereço completo
  const locationLabel: string | null = (() => {
    if (address) return address // endereço completo (pós-código)
    if (bairro && distanceLabel) return `${bairro} - ~${distanceLabel}`
    if (bairro) return bairro
    return null
  })()

  return (
    <div
      data-testid={`donation-card-${id}`}
      className={cn(
        "rounded-lg border bg-[var(--color-background-raw)] p-4 shadow-sm transition-shadow hover:shadow-md",
        isClosest ? "border-green-500 ring-1 ring-green-400/50" : "border-[var(--color-border-raw)]",
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
            {/* Badge "Mais próximo" — TASK-19 */}
            {isClosest && (
              <span
                data-testid={`donation-card-closest-badge-${id}`}
                className="inline-flex items-center rounded-full bg-green-100 border border-green-300 px-2 py-0.5 text-xs font-semibold text-green-800"
                aria-label="Doação mais próxima de você"
              >
                📍 Mais próximo
              </span>
            )}
            {distanceKm != null && (
              <span className="text-xs text-[var(--color-text-muted)]">
                ~{distanceKm.toFixed(1)} km
              </span>
            )}
            {!distanceKm && distanceLabel && (
              <span className="text-xs text-[var(--color-text-muted)]">
                {distanceLabel}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
            {displayTitle}
          </h3>
          {donorName && (
            <p className="text-sm text-[var(--color-text-secondary)] truncate">
              {donorName}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {locationLabel && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>
              {displayPortions} {displayPortions === 1 ? "porção" : "porções"}
            </span>
          </div>
          {windowEndFormatted && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Até {windowEndFormatted}</span>
            </div>
          )}
          {!locationLabel && radiusKm != null && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>Raio {radiusKm} km</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {isAvailable && onRequest && (
          <Button
            data-testid={`donation-card-request-button-${id}`}
            variant="default"
            size="md"
            className="flex-1"
            onClick={() => onRequest(id)}
          >
            Solicitar refeição
          </Button>
        )}
        {isCancellable && onCancel && (
          <Button
            data-testid={`donation-card-cancel-button-${id}`}
            variant="destructive"
            size="md"
            className="flex-1"
            onClick={() => onCancel(id)}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}
