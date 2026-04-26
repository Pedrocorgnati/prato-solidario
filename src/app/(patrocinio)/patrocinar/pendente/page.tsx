export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { Clock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

export const metadata = { title: 'Aguardando Pagamento — Prato Solidário' }

export default function PendentePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center space-y-6">
      <div className="flex justify-center">
        <Clock className="h-[72px] w-[72px] text-yellow-500" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Aguardando pagamento PIX
        </h1>
        <p className="mt-2 text-base text-[var(--color-text-muted)]">
          Seu pagamento PIX está em processamento. Aguardando confirmação do banco.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-4 text-left">
        <Mail className="h-5 w-5 shrink-0 text-[var(--color-text-muted)]" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          Você receberá um e-mail de confirmação quando o pagamento for aprovado.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="outline" asChild>
          <Link href={ROUTES.HOME}>Voltar para o início</Link>
        </Button>
      </div>
    </div>
  )
}
