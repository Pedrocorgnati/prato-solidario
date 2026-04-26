export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cadastro em Análise | Prato Solidário',
}

export default function AguardandoPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <Clock className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Cadastro em Análise</h1>
      <p className="text-[var(--color-text-secondary)]">
        Seu cadastro está em análise. Você será notificado por e-mail quando aprovado.
      </p>
      <p className="text-sm text-[var(--color-text-muted)]">
        Enquanto isso, vincule o Mercado Pago para agilizar sua aprovação.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <a href="/api/v1/auth/mercadopago/authorize">Vincular Mercado Pago</a>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  )
}
