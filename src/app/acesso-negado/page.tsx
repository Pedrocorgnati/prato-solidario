export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Acesso não autorizado',
  robots: { index: false, follow: false },
}

/**
 * Página de acesso negado — AUTH_003.
 * Exibida quando o usuário não tem permissão para acessar uma rota.
 * Sem stack trace ou informações técnicas ao usuário.
 * @see module-7-layout-navigation/TASK-1/ST005
 */
export default function AcessoNegadoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-danger)]/10">
        <svg
          className="h-10 w-10 text-[var(--color-danger)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      </div>
      <div className="space-y-2 max-w-sm">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Acesso não autorizado
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="default" asChild>
          <Link href={ROUTES.HOME}>Ir ao início</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ROUTES.LOGIN}>Entrar com outra conta</Link>
        </Button>
      </div>
    </main>
  )
}
