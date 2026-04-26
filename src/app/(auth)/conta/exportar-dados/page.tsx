export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { ExportRequestButton } from './ExportRequestButton'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Aguardando',
  PROCESSING: 'Processando',
  READY: 'Pronto',
  EXPIRED: 'Expirado',
  FAILED: 'Falhou',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'secondary',
  PROCESSING: 'default',
  READY: 'default',
  EXPIRED: 'destructive',
  FAILED: 'destructive',
}

/**
 * Página de exportação de dados LGPD.
 * @see module-6-profile-lgpd/TASK-4/ST001
 */
export const metadata = { title: 'Exportar Meus Dados — Prato Solidário' }

const ROLE_LABELS: Record<string, string> = {
  DOADOR: 'Doador',
  DOADOR_RESTAURANTE: 'Restaurante',
  RECEPTOR: 'Receptor',
  PATROCINADOR: 'Patrocinador',
  MARMITARIA: 'Marmitaria',
  ONG: 'ONG',
  ADMIN: 'Administrador',
}

async function ExportarDadosContent({ userId }: { userId: string }) {
  const [requests, userData, addressCount, consentCount] = await Promise.all([
    prisma.dataExportRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true, role: true, createdAt: true },
    }),
    prisma.address.count({ where: { userId } }),
    prisma.consentLog.count({ where: { userId } }),
  ])

  const hasPending = requests.some((r) => ['PENDING', 'PROCESSING'].includes(r.status))

  return (
    <>
      {/* Seção: Meus Dados Armazenados (US-025/SC1) */}
      {userData && (
        <section>
          <h2 className="mb-3 text-lg font-medium">Meus Dados Armazenados</h2>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Nome</dt>
                <dd className="font-medium">{userData.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">E-mail</dt>
                <dd className="font-medium">{userData.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Telefone</dt>
                <dd className="font-medium">
                  {userData.phone
                    ? userData.phone.replace(/(\d{2})(\d{2})(\d{4,5})(\d{4})/, '+$1 ($2) $3-$4')
                    : 'Não informado'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tipo de conta</dt>
                <dd className="font-medium">{ROLE_LABELS[userData.role] ?? userData.role}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Endereços salvos</dt>
                <dd className="font-medium">{addressCount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Registros de consentimento</dt>
                <dd className="font-medium">{consentCount}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Conta criada em</dt>
                <dd className="font-medium">
                  {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(userData.createdAt)}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      {/* Seção explicativa */}
      <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
        <p>A exportação completa incluirá: dados de perfil, endereços, histórico de doações/retiradas, registros de consentimento e logs de auditoria.</p>
        <p>Link de download válido por <strong>7 dias</strong>.</p>
        <p className="text-muted-foreground">Disponível em até 72h após a solicitação.</p>
      </div>

      <ExportRequestButton hasPending={hasPending} />

      {/* Histórico de solicitações */}
      <section>
        <h2 className="mb-4 text-lg font-medium">Histórico de Solicitações</h2>

        {requests.length === 0 ? (
          <EmptyState title="Nenhuma exportação solicitada ainda." />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Data</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(r.requestedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={STATUS_VARIANTS[r.status] ?? 'secondary'}
                        aria-label={`Status: ${STATUS_LABELS[r.status] ?? r.status}`}
                      >
                        {STATUS_LABELS[r.status] ?? r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'READY' && r.fileUrl ? (
                        <a
                          href={`/api/v1/lgpd/export?requestId=${r.id}`}
                          className="text-primary underline underline-offset-4 text-sm"
                        >
                          Baixar arquivo
                        </a>
                      ) : r.status === 'EXPIRED' ? (
                        <span className="text-muted-foreground text-xs">Link expirado. Solicite nova exportação.</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}

export default async function ExportarDadosPage() {
  const session = await requireSession()

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Caminho de navegação" className="text-sm text-muted-foreground">
        <span>Minha conta</span>
        <span className="mx-1" aria-hidden="true">&rsaquo;</span>
        <span className="font-medium text-foreground">Exportar meus dados</span>
      </nav>

      <h1 className="text-2xl font-semibold">Exportar Meus Dados</h1>

      <Suspense fallback={<LoadingSkeleton variant="card" count={3} />}>
        <ExportarDadosContent userId={session.id} />
      </Suspense>
    </div>
  )
}
