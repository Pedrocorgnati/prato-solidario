'use client'

/**
 * DiplomasClient — Client Component para download de diplomas anuais.
 * Recebe os anos disponíveis do Server Component pai (DiplomasSection).
 *
 * @see module-20-gamificacao/TASK-4/ST003
 */

import { useState } from 'react'

interface DiplomasClientProps {
  availableYears: number[]
  currentYear: number
}

export function DiplomasClient({ availableYears, currentYear }: DiplomasClientProps) {
  const nextAvailableYear = currentYear + 1
  const [downloadingYear, setDownloadingYear] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<number, string>>({})

  async function handleDownload(year: number) {
    if (downloadingYear !== null) return
    setDownloadingYear(year)
    setErrors((prev) => ({ ...prev, [year]: '' }))

    try {
      const res = await fetch(`/api/v1/gamification/diplomas?year=${year}`)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const message =
          res.status === 422
            ? `Você não teve doações em ${year}.`
            : (data.error?.message as string | undefined) ?? 'Não foi possível gerar o diploma agora. Tente novamente.'
        setErrors((prev) => ({ ...prev, [year]: message }))
        return
      }

      const { url } = (await res.json()) as { url: string }
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      setErrors((prev) => ({
        ...prev,
        [year]: 'Não foi possível gerar o diploma agora. Tente novamente.',
      }))
    } finally {
      setDownloadingYear(null)
    }
  }

  if (availableYears.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border-raw)] p-5 text-center space-y-1.5">
        <p className="text-2xl">📜</p>
        <p className="text-sm text-[var(--color-text-muted)]">
          Continue contribuindo! Seu diploma de {currentYear} estará disponível
          em janeiro de {nextAvailableYear}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {availableYears.map((year) => {
        const isDownloading = downloadingYear === year
        const errorMsg = errors[year]

        return (
          <div key={year} className="space-y-1">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border-raw)] px-4 py-3">
              <div className="flex items-center gap-2">
                <span aria-hidden="true">📜</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  Diploma {year}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleDownload(year)}
                disabled={isDownloading || downloadingYear !== null}
                aria-label={`Download do diploma de ${year}`}
                className="text-sm font-medium text-[var(--color-primary)] hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-1"
              >
                {isDownloading ? (
                  <>
                    <span
                      className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    Gerando...
                  </>
                ) : (
                  'Download'
                )}
              </button>
            </div>

            {errorMsg && (
              <p role="alert" className="text-xs text-[var(--color-error)] px-1">
                {errorMsg}
              </p>
            )}
          </div>
        )
      })}

      {/* Placeholder para o próximo ano */}
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-[var(--color-border-raw)] px-4 py-3 opacity-60">
        <span aria-hidden="true">📜</span>
        <span className="text-sm text-[var(--color-text-muted)]">
          Diploma disponível ao final de {currentYear}
        </span>
      </div>
    </div>
  )
}
