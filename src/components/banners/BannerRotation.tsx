'use client'

/**
 * BannerRotation — Rotação automática de múltiplos banners.
 * - Intervalo: 5s (padrão, conforme spec ADM-013)
 * - Fade suave com prefers-reduced-motion
 * - Pausar no hover
 * - aria-live="polite" para acessibilidade
 * @see module-17-banners-system/TASK-4/ST002
 */

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { BannerPosition } from '@prisma/client'

interface BannerItem {
  id: string
  title: string
  imageUrl: string
  linkUrl: string | null
  position: BannerPosition
}

const DIMENSIONS: Record<BannerPosition, { aspectRatio: string; sizes: string }> = {
  TOP:     { aspectRatio: 'aspect-[16/3]', sizes: '100vw' },
  SIDEBAR: { aspectRatio: 'aspect-[1/3]',  sizes: '240px' },
  INLINE:  { aspectRatio: 'aspect-square',  sizes: '(max-width: 640px) 100vw, 600px' },
}

interface BannerRotationProps {
  banners: BannerItem[]
  position: BannerPosition
  intervalMs?: number
}

export function BannerRotation({ banners, position, intervalMs = 5_000 }: BannerRotationProps) {
  const [current, setCurrent] = React.useState(0)
  const [visible, setVisible] = React.useState(true)
  const [paused, setPaused] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const dim = DIMENSIONS[position]

  // Respeitar prefers-reduced-motion
  const prefersReduced = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const goTo = React.useCallback(
    (idx: number) => {
      if (prefersReduced) {
        setCurrent(idx)
        return
      }
      setVisible(false)
      setTimeout(() => {
        setCurrent(idx)
        setVisible(true)
      }, 300)
    },
    [prefersReduced]
  )

  const advance = React.useCallback(() => {
    setCurrent((prev) => {
      const next = (prev + 1) % banners.length
      goTo(next)
      return prev // goTo atualiza via setTimeout
    })
  }, [banners.length, goTo])

  const startTimer = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(advance, intervalMs)
  }, [advance, intervalMs])

  React.useEffect(() => {
    if (!paused && banners.length > 1) {
      startTimer()
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paused, banners.length, startTimer])

  if (banners.length === 0) return null

  const banner = banners[current]

  const img = (
    <div
      className={`relative overflow-hidden rounded-lg ${dim.aspectRatio}`}
      style={{ opacity: visible || prefersReduced ? 1 : 0, transition: prefersReduced ? 'none' : 'opacity 300ms ease' }}
    >
      <Image
        src={banner.imageUrl}
        alt={banner.title}
        fill
        className="object-cover"
        sizes={dim.sizes}
      />
      <span
        className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[9px] text-white opacity-70"
        aria-hidden="true"
      >
        Publicidade
      </span>
    </div>
  )

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Banner */}
      <div aria-live="polite" aria-atomic="true">
        {banner.linkUrl ? (
          <Link
            href={banner.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visitar site de ${banner.title} (abre em nova aba)`}
            onClick={() =>
              fetch(`/api/v1/banners/${banner.id}/click?position=${position}`, { method: 'POST' }).catch(() => {})
            }
          >
            {img}
          </Link>
        ) : img}
      </div>

      {/* Label Apoiador */}
      <p className="mt-0.5 text-center text-[12px] text-[var(--color-text-muted)]" aria-hidden="true">
        Apoiador
      </p>

      {/* Indicadores (bolinhas) */}
      {banners.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5" role="tablist" aria-label="Navegação de banners">
          {banners.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`Banner ${i + 1} de ${banners.length}`}
              onClick={() => {
                goTo(i)
                startTimer()
              }}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === current
                  ? 'bg-[var(--color-primary-raw)]'
                  : 'bg-[var(--color-border-raw)]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
