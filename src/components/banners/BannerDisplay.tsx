'use client'

/**
 * BannerDisplay — Exibe banners em posições fixas (TOP, SIDEBAR, INLINE).
 * Colapsa silenciosamente quando não há banner ativo.
 * Acessibilidade: role="complementary", aria-label, prefers-reduced-motion.
 * @see module-17-banners-system/TASK-4/ST001
 */

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { BannerRotation } from './BannerRotation'
import type { BannerPosition } from '@/types/enums'

interface BannerItem {
  id: string
  title: string
  imageUrl: string
  linkUrl: string | null
  position: BannerPosition
  type: string
}

interface BannerDisplayProps {
  position: BannerPosition
}

const DIMENSIONS: Record<BannerPosition, { width: string; aspectRatio: string; sizes: string }> = {
  TOP:     { width: 'w-full',    aspectRatio: 'aspect-[16/3]', sizes: '100vw' },
  SIDEBAR: { width: 'w-[240px]', aspectRatio: 'aspect-[1/3]',  sizes: '240px' },
  INLINE:  { width: 'w-full',    aspectRatio: 'aspect-square',  sizes: '(max-width: 640px) 100vw, 600px' },
}

export function BannerDisplay({ position }: BannerDisplayProps) {
  const [banners, setBanners] = React.useState<BannerItem[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const dim = DIMENSIONS[position]

  React.useEffect(() => {
    fetch(`/api/v1/banners/active?position=${position}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        setBanners(data?.banners ?? [])
      })
      .catch(() => setBanners([]))
      .finally(() => setLoading(false))
  }, [position])

  if (loading) {
    return (
      <Skeleton
        className={`${dim.width} ${dim.aspectRatio} rounded-lg`}
        aria-hidden="true"
      />
    )
  }

  if (!banners || banners.length === 0) {
    // Colapsa completamente — sem espaço vazio
    return null
  }

  const content = banners.length === 1
    ? <SingleBanner banner={banners[0]} dim={dim} />
    : <BannerRotation banners={banners} position={position} />

  return (
    <section
      role="complementary"
      aria-label={`Anúncio: ${banners[0]?.title ?? 'banner'}`}
      className={`${dim.width} relative`}
      data-testid={`banner-display-${position.toLowerCase()}`}
    >
      {content}
    </section>
  )
}

// ── SingleBanner ──────────────────────────────────────────────────────────────

function SingleBanner({
  banner,
  dim,
}: {
  banner: BannerItem
  dim: { width: string; aspectRatio: string; sizes: string }
}) {
  const img = (
    <div className={`relative overflow-hidden rounded-lg ${dim.aspectRatio}`}>
      <Image
        src={banner.imageUrl}
        alt={banner.title}
        fill
        className="object-cover"
        sizes={dim.sizes}
      />
      {/* Tag "Publicidade" — conformidade publicitária */}
      <span
        className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[9px] text-white opacity-70"
        aria-hidden="true"
      >
        Publicidade
      </span>
    </div>
  )

  return (
    <div>
      {banner.linkUrl ? (
        <Link
          href={banner.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visitar site de ${banner.title} (abre em nova aba)`}
          onClick={() => trackClick(banner.id, banner.position)}
        >
          {img}
        </Link>
      ) : img}
      <p className="mt-0.5 text-center text-[12px] text-[var(--color-text-muted)]" aria-hidden="true">
        Apoiador
      </p>
    </div>
  )
}

function trackClick(bannerId: string, position: BannerPosition) {
  fetch(`/api/v1/banners/${bannerId}/click?position=${position}`, { method: 'POST' }).catch(() => {})
}
