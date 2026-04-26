/**
 * BannerCreditCard — exibe banner de saldo disponível para saque/campanha.
 * @see intake-review/TASK-18/ST001
 */
import { CreditCard, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'

interface BannerCreditCardProps {
  availableBalance: number
  totalEarned: number
  pendingBalance?: number
  className?: string
}

export function BannerCreditCard({
  availableBalance,
  totalEarned,
  pendingBalance = 0,
  className,
}: BannerCreditCardProps) {
  return (
    <div
      data-testid="banner-credit-card"
      className={`rounded-xl bg-gradient-to-br from-green-700 to-green-600 p-6 text-white shadow-md ${className ?? ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-white/80 mb-1">Saldo disponível</p>
          <p className="text-3xl font-bold tracking-tight">
            {formatCurrency(availableBalance)}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <CreditCard className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-white/70" aria-hidden="true" />
          <span className="text-white/80">Total recebido:</span>
          <span className="font-medium">{formatCurrency(totalEarned)}</span>
        </div>
        {pendingBalance > 0 && (
          <div className="text-white/70 text-xs">
            + {formatCurrency(pendingBalance)} pendente
          </div>
        )}
      </div>
    </div>
  )
}
