export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { marmitariaRepository } from '@/repositories/marmitaria.repository'
import { BannerCreditCard } from '@/components/marmitaria/BannerCreditCard'

/**
 * Campanhas de banner — lista campanhas ativas e exibe saldo disponível.
 * @see intake-review/TASK-18/ST001
 */
export const metadata: Metadata = {
  title: 'Campanhas — Marmitaria | Prato Solidário',
}

export default async function CampanhasPage() {
  const user = await requireRole(['MARMITARIA'])

  const profile = await marmitariaRepository.findProfileByUserId(user.id)
  const balance = profile
    ? await marmitariaRepository.computeBalance(profile.id, profile.balance)
    : null

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Campanhas</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Gerencie suas campanhas de destaque no Prato Solidário.
          </p>
        </div>
        <Link
          href="/marmitaria/campanhas/nova"
          data-testid="campanhas-nova-link"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-green-700 px-4 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nova Campanha
        </Link>
      </div>

      {/* Saldo Banner */}
      {balance && (
        <BannerCreditCard
          availableBalance={balance.available ?? 0}
          totalEarned={balance.totalEarned ?? 0}
          pendingBalance={balance.pending ?? 0}
        />
      )}

      {/* Lista de campanhas — placeholder */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Campanhas ativas
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Nenhuma campanha ativa no momento.{' '}
          <Link href="/marmitaria/campanhas/nova" className="text-green-700 underline underline-offset-2">
            Criar primeira campanha
          </Link>
        </p>
      </section>
    </main>
  )
}
