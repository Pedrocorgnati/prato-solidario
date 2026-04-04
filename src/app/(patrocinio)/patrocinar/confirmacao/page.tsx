import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/lib/constants"

export const metadata = { title: "Patrocínio Confirmado — Prato Solidário" }

export default function ConfirmacaoPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center space-y-6">
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-success)]/10">
          <CheckCircle className="h-10 w-10 text-[var(--color-success)]" />
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Patrocínio confirmado!</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Você acabou de contribuir com 5 marmitas solidárias. Obrigado por fazer a diferença!
        </p>
      </div>
      <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-surface)] p-4 text-left space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">Marmitaria</span>
          <span className="font-medium">Marmitaria da Dona Maria</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">Marmitas</span>
          <span className="font-medium">5</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">Valor pago</span>
          <span className="font-bold text-[var(--color-primary-raw)]">R$ 70,00</span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Button variant="default" size="lg" asChild>
          <Link href={ROUTES.PATROCINAR_HISTORICO}>Ver histórico</Link>
        </Button>
        <Button variant="ghost" size="md" asChild>
          <Link href={ROUTES.HOME}>Voltar ao início</Link>
        </Button>
      </div>
    </div>
  )
}
