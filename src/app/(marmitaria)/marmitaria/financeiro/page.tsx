import { CreditCard } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

export const metadata = { title: "Financeiro — Prato Solidário" }

// RESOLVED: /marmitaria/financeiro ausente — link quebrado no BottomNav da marmitaria
export default function FinanceiroPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Financeiro</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Saldo, repasses e extrato de transações.
        </p>
      </div>
      <EmptyState
        icon={<CreditCard className="h-8 w-8" />}
        title="Sem movimentações ainda"
        description="Conecte o Mercado Pago e comece a receber patrocínios para visualizar seu extrato."
      />
    </div>
  )
}
