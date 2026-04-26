export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import Link from 'next/link'
import { ChefHat, Package, CreditCard, Clock, AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ROUTES } from '@/lib/constants'
import { requireRole } from '@/lib/auth/session'
import { marmitariaRepository } from '@/repositories/marmitaria.repository'
import { formatCurrency } from '@/utils/formatters'

export const metadata: Metadata = {
  title: 'Painel — Marmitaria | Prato Solidário',
}

async function fetchBalance() {
  const user = await requireRole(['MARMITARIA'])

  const profile = await marmitariaRepository.findProfileByUserId(user.id)
  if (!profile) return null

  if (!marmitariaRepository.isActive(profile.status)) return null

  const balance = await marmitariaRepository.computeBalance(profile.id, profile.balance)
  return {
    ...balance,
    mpConnected: profile.mpConnection?.status === 'CONNECTED',
  }
}

export default async function MarmitariaDashboardPage() {
  const data = await fetchBalance()

  if (!data) {
    return (
      <div data-testid="marmitaria-dashboard" className="space-y-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Painel da Marmitaria</h1>
        <EmptyState
          icon={<ChefHat className="h-8 w-8" />}
          title="Não foi possível carregar o saldo"
          description="Tente novamente mais tarde."
        />
      </div>
    )
  }

  const isEmpty = data.available === 0 && data.delivered === 0 && data.pending === 0

  return (
    <div data-testid="marmitaria-dashboard" className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Painel da Marmitaria</h1>

      {!data.mpConnected && (
        <div className="flex items-start gap-3 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:bg-amber-950/20">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Vincule o Mercado Pago para receber pagamentos
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Sem a vinculação, os pagamentos dos patrocinadores não serão processados.
            </p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href={ROUTES.MARMITARIA_MP_CONNECT}>
                Vincular Mercado Pago <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {isEmpty ? (
        <EmptyState
          icon={<ChefHat className="h-8 w-8" />}
          title="Nenhuma marmita patrocinada ainda"
          description="Aguarde patrocinadores. Quando comprarem marmitas, os dados aparecerão aqui."
        />
      ) : (
        <div data-testid="marmitaria-stats" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <ChefHat className="h-5 w-5" />
              <span className="text-sm font-medium">Disponíveis</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-green-800 dark:text-green-300" aria-live="polite">
              {data.available}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500">marmitas para entrega</p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Package className="h-5 w-5" />
              <span className="text-sm font-medium">Entregues este Mês</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-blue-800 dark:text-blue-300">
              {data.delivered}
            </p>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CreditCard className="h-5 w-5" />
              <span className="text-sm font-medium">Recebido</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-emerald-800 dark:text-emerald-300">
              {formatCurrency(data.totalReceivedBrl)}
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Pendentes</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-amber-800 dark:text-amber-300">
              {data.pending}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500">aguardando confirmação</p>
          </div>
        </div>
      )}

      <div data-testid="marmitaria-actions" className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" size="lg" asChild>
          <Link href={ROUTES.MARMITARIA_ENTREGAS}>
            <Package className="mr-2 h-5 w-5" />
            Ver entregas pendentes
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href={ROUTES.MARMITARIA_CONFIG}>
            <Clock className="mr-2 h-5 w-5" />
            Gerenciar horários
          </Link>
        </Button>
      </div>
    </div>
  )
}
