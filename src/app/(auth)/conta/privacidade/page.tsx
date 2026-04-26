export const dynamic = 'force-dynamic'
import { requireSession } from '@/lib/auth/session'
import { getUserConsents, needsNewConsent } from '@/services/lgpd.service'
import { EmptyState } from '@/components/ui/empty-state'
import { AcceptTermsButton } from './AcceptTermsButton'
import { PreferencesSection } from './PreferencesSection'

/**
 * Página de privacidade e histórico de consentimentos.
 * @see module-6-profile-lgpd/TASK-3/ST003
 */
export const metadata = { title: 'Privacidade e Termos — Prato Solidário' }

export default async function PrivacidadePage() {
  const session = await requireSession()
  const [consents, requiresNewConsent] = await Promise.all([
    getUserConsents(session.id),
    needsNewConsent(session.id),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Caminho de navegação" className="text-sm text-muted-foreground">
        <span>Minha conta</span>
        <span className="mx-1" aria-hidden="true">&rsaquo;</span>
        <span className="font-medium text-foreground">Privacidade</span>
      </nav>

      <h1 className="text-2xl font-semibold">Privacidade e Termos</h1>

      {/* Banner nova versão */}
      {requiresNewConsent && (
        <div
          role="alert"
          className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:bg-yellow-900/20"
        >
          <p className="mb-3 font-medium text-yellow-800 dark:text-yellow-300">
            Nova versão dos Termos disponível. Revise e aceite para continuar usando a plataforma.
          </p>
          <AcceptTermsButton />
        </div>
      )}

      {/* Links documentos */}
      <div className="flex gap-4 text-sm text-primary underline underline-offset-4">
        <a href="/termos" target="_blank" rel="noopener noreferrer">
          Termos de Uso
        </a>
        <a href="/privacidade" target="_blank" rel="noopener noreferrer">
          Política de Privacidade
        </a>
      </div>

      {/* Preferências granulares LGPD — TASK-5 */}
      <PreferencesSection />

      {/* Histórico de consentimentos */}
      <section>
        <h2 className="mb-4 text-lg font-medium">Histórico de Consentimentos</h2>

        {consents.length === 0 ? (
          <EmptyState
            title="Nenhum registro formal"
            description="Você ainda não aceitou nossos termos formalmente."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Data</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Versão</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {consents.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(c.acceptedAt)}
                    </td>
                    <td className="px-4 py-3">{c.version}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {c.ipAddress
                        ? c.ipAddress.replace(/\.\d+$/, '.XXX')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
