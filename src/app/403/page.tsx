export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Acesso Negado — Prato Solidário',
  robots: { index: false, follow: false },
}

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold text-destructive">Acesso não autorizado</h1>
      <p className="text-center max-w-sm text-muted-foreground">
        Você não tem permissão para acessar esta página. Se acredita que isso é um erro, entre em
        contato com o suporte.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        aria-label="Voltar para o início"
      >
        Ir ao início
      </Link>
      <a
        href="mailto:suporte@prato-solidario.com.br"
        className="text-sm text-muted-foreground underline"
      >
        Contato com suporte
      </a>
    </main>
  )
}
