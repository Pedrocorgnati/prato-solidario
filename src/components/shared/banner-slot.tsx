import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface BannerSlotProps {
  imageUrl?: string
  linkUrl?: string
  alt?: string
  className?: string
  aspectRatio?: "banner" | "square"
}

export function BannerSlot({
  imageUrl,
  linkUrl,
  alt = "Banner publicitário",
  className,
  aspectRatio = "banner",
}: BannerSlotProps) {
  if (!imageUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border-raw)] bg-[var(--color-surface)]",
          aspectRatio === "banner" ? "h-24 w-full" : "aspect-square w-full",
          className
        )}
      >
        <span className="text-xs text-[var(--color-text-muted)]">Espaço publicitário</span>
      </div>
    )
  }

  const content = (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg",
        aspectRatio === "banner" ? "h-24 w-full" : "aspect-square w-full",
        className
      )}
    >
      <Image src={imageUrl} alt={alt} fill className="object-cover" />
    </div>
  )

  if (linkUrl) {
    return (
      <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
        {content}
      </Link>
    )
  }

  return content
}
