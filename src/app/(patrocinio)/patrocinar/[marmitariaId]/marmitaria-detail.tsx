"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/utils/formatters"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarmitariaData {
  id: string
  name: string
  description: string | null
  photo: string | null
  neighborhood: string | null
  city: string | null
  address: string | null
  pricePerMeal: number | null
  availableCredits: number
  schedule: string | null
}

// ---------------------------------------------------------------------------
// MarmitariaDetail — interactive stepper
// ---------------------------------------------------------------------------

export function MarmitariaDetail({ data }: { data: MarmitariaData }) {
  const [quantity, setQuantity] = React.useState(5)

  const MIN = 5
  const MAX = 100
  const pricePerMeal = data.pricePerMeal ?? 0
  const total = quantity * pricePerMeal
  const location = [data.neighborhood, data.city].filter(Boolean).join(", ")

  function handleChange(next: number) {
    if (Number.isNaN(next)) return
    if (next < MIN) return setQuantity(MIN)
    if (next > MAX) return setQuantity(MAX)
    setQuantity(next)
  }

  return (
    <div
      data-testid="marmitaria-detail"
      className="mx-auto max-w-2xl px-4 py-8 space-y-6"
    >
      {/* Hero */}
      <div className="relative h-64 max-h-64 w-full overflow-hidden rounded-lg bg-[var(--color-surface)]">
        {data.photo ? (
          <Image
            src={data.photo}
            alt={data.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-6xl">🍱</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {data.name}
        </h1>

        {location && (
          <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
            <MapPin className="h-4 w-4 shrink-0" />
            <span>{location}</span>
          </div>
        )}

        {data.schedule && (
          <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{data.schedule}</span>
          </div>
        )}

        {data.description && (
          <p className="text-sm text-[var(--color-text-muted)] pt-1">
            {data.description}
          </p>
        )}
      </div>

      {/* Stepper */}
      <div className="space-y-3 rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          Quantas refeições deseja patrocinar?
        </p>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            aria-label="Diminuir quantidade"
            disabled={quantity <= MIN}
            onClick={() => handleChange(quantity - 1)}
          >
            <Minus className="h-5 w-5" />
          </Button>

          <Input
            type="number"
            min={MIN}
            max={MAX}
            value={quantity}
            onChange={(e) => handleChange(Number(e.target.value))}
            className="h-11 w-20 text-center text-lg font-semibold"
            aria-label="Quantidade de refeições"
          />

          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            aria-label="Aumentar quantidade"
            disabled={quantity >= MAX}
            onClick={() => handleChange(quantity + 1)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <p className="text-sm text-[var(--color-text-muted)]">
          Valor por refeição:{" "}
          <span className="font-medium text-[var(--color-text-primary)]">
            {formatCurrency(pricePerMeal)}
          </span>
        </p>
      </div>

      {/* CTA — sticky on mobile */}
      <div className="sticky bottom-0 bg-[var(--color-background-raw)] border-t border-[var(--color-border-raw)] p-4 md:static md:border-0 md:p-0">
        <Button
          data-testid="patrocinar-cta"
          variant="default"
          size="lg"
          className="w-full"
          asChild
        >
          <Link
            href={`/patrocinar/checkout?marmitariaId=${data.id}&quantity=${quantity}`}
          >
            Patrocinar {quantity} refeições — {formatCurrency(total)}
          </Link>
        </Button>
      </div>
    </div>
  )
}
