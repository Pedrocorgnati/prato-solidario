'use client'
export const dynamic = 'force-dynamic'

import { ChefHat, Package, CreditCard, RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMarmitariaBalance } from '@/hooks/useMarmitariaBalance'
import { formatCurrency } from '@/utils/formatters'

export default function SaldoPage() {
  const { data, isLoading, error, lastUpdatedAt, refresh } = useMarmitariaBalance(10000)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Saldo em Tempo Real</h1>

      {/* Main balance display */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-950/20">
        <ChefHat className="mx-auto h-10 w-10 text-green-600" />
        <p
          className="mt-4 text-5xl font-bold text-green-800 dark:text-green-300"
          aria-live="polite"
        >
          {isLoading && !data ? '—' : (data?.available ?? 0)}
        </p>
        <p className="mt-2 text-lg text-green-700 dark:text-green-400">Marmitas Disponíveis</p>
      </div>

      {/* Secondary stats */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <Package className="h-4 w-4" />
            <span className="text-sm">Entregues este mês</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]" aria-live="polite">
            {data?.delivered ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <CreditCard className="h-4 w-4" />
            <span className="text-sm">Total recebido</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]" aria-live="polite">
            {formatCurrency(data?.totalReceivedBrl ?? 0)}
          </p>
        </div>
      </div>

      {/* Polling indicator */}
      <div className="flex items-center justify-between rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-3">
        <div className="flex items-center gap-2 text-sm">
          {error ? (
            <>
              <WifiOff className="h-4 w-4 text-amber-500" />
              <span className="text-amber-600">Falha ao atualizar</span>
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-green-600">Ao vivo</span>
            </>
          )}
          {lastUpdatedAt && (
            <span className="text-[var(--color-text-muted)]">
              <Clock className="mr-1 inline h-3 w-3" />
              Atualizado às{' '}
              {lastUpdatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-1 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>
    </div>
  )
}
