'use client'
export const dynamic = 'force-dynamic'

/**
 * Página de denúncias — dados reais via /api/v1/admin/reports
 * Substituiu mockReports hardcoded (intake-review TASK-8 ST004)
 */

import * as React from 'react'
import { AlertOctagon } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'

interface ReportItem {
  id: string
  type: string
  reportedUser: { id: string; name: string; email: string } | null
  createdAt: string
  status: string
}

export default function AdminDenunciasPage() {
  const [reports, setReports] = React.useState<ReportItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)

  const fetchReports = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/admin/reports?page=${page}&limit=20`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setReports(data.reports ?? [])
      setTotalPages(data.totalPages ?? 1)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Falha ao carregar denúncias: ${msg}`)
    } finally {
      setLoading(false)
    }
  }, [page])

  React.useEffect(() => {
    void fetchReports()
  }, [fetchReports])

  const tableData = reports.map((r) => ({
    id: r.id.slice(0, 8),
    tipo: r.type,
    usuario: r.reportedUser?.name ?? '—',
    email: r.reportedUser?.email ?? '—',
    status: r.status,
    data: new Date(r.createdAt).toLocaleDateString('pt-BR'),
  }))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Denúncias</h1>

      {loading ? (
        <div data-testid="skeleton-table">
          <LoadingSkeleton variant="card" count={5} />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft,#fee)] p-4 text-sm text-[var(--color-danger)]"
        >
          <p className="font-medium">{error}</p>
          <button
            type="button"
            onClick={() => void fetchReports()}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Tentar novamente
          </button>
        </div>
      ) : reports.length === 0 ? (
        <EmptyState icon={<AlertOctagon className="h-8 w-8" />} title="Nenhuma denúncia" />
      ) : (
        <>
          <DataTable
            data={tableData}
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'tipo', header: 'Tipo' },
              { key: 'usuario', header: 'Usuário' },
              { key: 'email', header: 'E-mail' },
              { key: 'status', header: 'Status' },
              { key: 'data', header: 'Data' },
            ]}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm px-3 py-1 rounded border border-[var(--color-border-raw)] disabled:opacity-40 hover:bg-[var(--color-surface)]"
              >
                Anterior
              </button>
              <span className="text-sm text-[var(--color-text-muted)]">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-sm px-3 py-1 rounded border border-[var(--color-border-raw)] disabled:opacity-40 hover:bg-[var(--color-surface)]"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
