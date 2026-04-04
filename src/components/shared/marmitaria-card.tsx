import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MarmitariaCardProps {
  id: string
  name: string
  photo?: string
  address: string
  pricePerMeal: number
  rating?: number
  distance?: string
  className?: string
}

export function MarmitariaCard({
  id,
  name,
  photo,
  address,
  pricePerMeal,
  rating,
  distance,
  className,
}: MarmitariaCardProps) {
  return (
    <div
      data-testid={`marmitaria-card-${id}`}
      className={cn(
        "rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] overflow-hidden shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      <div className="relative h-36 bg-[var(--color-surface)]">
        {/* @ASSET_PLACEHOLDER
        name: marmitaria-placeholder
        type: image
        extension: png
        dimensions: 400x150
        description: Imagem placeholder para marmitaria sem foto
        */}
        {photo ? (
          <Image src={photo} alt={name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl">🍱</span>
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[var(--color-text-primary)] leading-tight">{name}</h3>
          {rating && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="h-3.5 w-3.5 fill-[var(--color-accent-raw)] text-[var(--color-accent-raw)]" />
              <span className="text-xs font-medium">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{address}</span>
          {distance && <span className="shrink-0">· {distance}</span>}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-bold text-[var(--color-primary-raw)]">
            R$ {pricePerMeal.toFixed(2).replace(".", ",")} <span className="font-normal text-xs text-[var(--color-text-muted)]">/marmita</span>
          </span>
          <Button data-testid={`marmitaria-card-patrocinar-button-${id}`} variant="default" size="sm" asChild>
            <Link href={`/patrocinar?marmitaria=${id}`}>Patrocinar</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
