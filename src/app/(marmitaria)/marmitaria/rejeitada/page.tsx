export const dynamic = 'force-dynamic'
import { Metadata } from 'next'
import { XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cadastro Reprovado | Prato Solidário',
}

export default function RejeitadaPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
        <XCircle className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Cadastro Reprovado</h1>
      <p className="text-[var(--color-text-secondary)]">
        Seu cadastro foi reprovado. Entre em contato com o suporte para mais informações.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <a href="mailto:suporte@pratosolidario.com.br">Falar com Suporte</a>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  )
}
