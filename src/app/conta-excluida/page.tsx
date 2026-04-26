import Link from 'next/link'

/**
 * Página pública exibida após exclusão de conta.
 * @see module-6-profile-lgpd/TASK-5/ST005
 */
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Conta Excluída — Prato Solidário' }

export default function ContaExcluidaPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-3xl font-semibold">Conta excluída</h1>
        <p className="text-muted-foreground leading-relaxed">
          Seus dados pessoais serão removidos em até <strong>30 dias</strong>.
          Seu histórico de doações foi preservado de forma anônima para fins de
          relatório de impacto social.
        </p>
        <p className="text-sm text-muted-foreground">
          Se você mudou de ideia dentro do prazo de 30 dias, entre em contato com o suporte.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </main>
  )
}
