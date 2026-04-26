'use client'

/**
 * BannerPreview — Preview ao vivo do banner nas 3 posições.
 * @see module-17-banners-system/TASK-1/ST003
 */

import * as React from 'react'
import Image from 'next/image'

type Position = 'TOP' | 'SIDEBAR' | 'INLINE'

interface BannerPreviewProps {
  imageUrl: string | null
  position: Position
  title: string
}

const SPECS: Record<Position, { label: string; aspectRatio: string; dim: string }> = {
  TOP:     { label: '16:3 (topo de página)',  aspectRatio: 'aspect-[16/3]',  dim: 'w-full max-w-lg' },
  SIDEBAR: { label: '1:3 (barra lateral)',    aspectRatio: 'aspect-[1/3]',   dim: 'w-[140px]' },
  INLINE:  { label: '1:1 (quadrado inline)',  aspectRatio: 'aspect-square',  dim: 'w-[180px]' },
}

export function BannerPreview({ imageUrl, position, title }: BannerPreviewProps) {
  const spec = SPECS[position]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[var(--color-text-secondary)]">
          Pré-visualização — proporção {spec.label}
        </p>
      </div>

      <div className={`relative ${spec.dim} ${spec.aspectRatio} overflow-hidden rounded-lg border border-dashed border-[var(--color-border-raw)] bg-[var(--color-surface)]`}>
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={title || 'Pré-visualização do banner'}
              fill
              className="object-cover"
              unoptimized
            />
            {/* Overlay de draft */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                Pré-visualização — não publicado
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-center text-xs text-[var(--color-text-muted)]">
              Faça upload de uma imagem para ver o preview
            </span>
          </div>
        )}

        {/* Tag Publicidade */}
        {imageUrl && (
          <span className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[9px] text-white opacity-70">
            Publicidade
          </span>
        )}
      </div>

      <p className="text-center text-[12px] text-[var(--color-text-muted)]">Apoiador</p>
    </div>
  )
}
