export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { BannerScheduleForm } from '@/components/marmitaria/BannerScheduleForm'

/**
 * Nova campanha de banner para marmitaria.
 * @see intake-review/TASK-18/ST002
 */
export const metadata: Metadata = {
  title: 'Nova Campanha — Marmitaria | Prato Solidário',
}

export default async function NovaCampanhaPage() {
  // Garante que apenas MARMITARIA acessa esta página
  await requireRole(['MARMITARIA'])

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/marmitaria/campanhas"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border-raw)] px-3 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
          aria-label="Voltar para campanhas"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar
        </Link>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Nova Campanha</h1>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)]">
        Crie uma campanha para destacar sua marmitaria para os usuários do Prato Solidário.
      </p>

      <BannerScheduleForm />
    </main>
  )
}
