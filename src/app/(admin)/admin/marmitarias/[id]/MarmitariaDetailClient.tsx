'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ModerationDialog } from '@/components/admin/ModerationDialog'
import { useToast } from '@/hooks/useToast'
import { approveMarmitaria, rejectMarmitaria } from '@/actions/admin-marmitarias.actions'
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react'

interface MarmitariaDetail {
  id: string
  tradeName: string
  cnpj: string
  status: string
  createdAt: string
  user: { id: string; name: string; email: string; phone?: string }
  address?: { street?: string; number?: string; complement?: string; neighborhood?: string; city?: string; state?: string; zipCode?: string }
  lastAction?: { action: string; metadata: Record<string, unknown>; createdAt: string } | null
}

interface Props {
  marmitaria: MarmitariaDetail
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: 'Pendente de Aprovação',
  ACTIVE: 'Ativa',
  SUSPENDED: 'Suspensa',
  REJECTED: 'Rejeitada',
  INACTIVE: 'Rejeitada',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_APPROVAL: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-yellow-100 text-yellow-800',
  REJECTED: 'bg-red-100 text-red-800',
  INACTIVE: 'bg-red-100 text-red-800',
}

export function MarmitariaDetailClient({ marmitaria }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [approveOpen, setApproveOpen] = React.useState(false)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const isPending = marmitaria.status === 'PENDING_APPROVAL'
  const isRejected = marmitaria.status === 'REJECTED' || marmitaria.status === 'INACTIVE'

  async function handleApprove(observacoes: string) {
    setLoading(true)
    try {
      const result = await approveMarmitaria(marmitaria.id, observacoes || undefined)
      if (result.success) {
        toast.success('Marmitaria aprovada com sucesso!')
        setApproveOpen(false)
        router.push('/admin/marmitarias')
      } else {
        toast.error(`Erro: ${result.error}`)
      }
    } catch {
      toast.error('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  async function handleReject(motivo: string) {
    setLoading(true)
    try {
      const result = await rejectMarmitaria(marmitaria.id, motivo)
      if (result.success) {
        toast.success('Marmitaria rejeitada')
        setRejectOpen(false)
        router.push('/admin/marmitarias')
      } else {
        toast.error(`Erro: ${result.error}`)
      }
    } catch {
      toast.error('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  const addr = marmitaria.address

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/marmitarias')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{marmitaria.tradeName}</h1>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[marmitaria.status] ?? 'bg-gray-100 text-gray-800'}`}>
          {STATUS_LABELS[marmitaria.status] ?? marmitaria.status}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-[var(--color-border-raw)] p-4 space-y-3">
          <h2 className="font-semibold text-[var(--color-text-primary)]">Dados do Responsável</h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-[var(--color-text-muted)]">Nome</dt><dd>{marmitaria.user.name}</dd></div>
            <div><dt className="text-[var(--color-text-muted)]">E-mail</dt><dd>{marmitaria.user.email}</dd></div>
            {marmitaria.user.phone && <div><dt className="text-[var(--color-text-muted)]">Telefone</dt><dd>{marmitaria.user.phone}</dd></div>}
          </dl>
        </div>

        <div className="rounded-lg border border-[var(--color-border-raw)] p-4 space-y-3">
          <h2 className="font-semibold text-[var(--color-text-primary)]">Dados da Marmitaria</h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-[var(--color-text-muted)]">CNPJ</dt><dd>{marmitaria.cnpj || 'Não informado'}</dd></div>
            <div><dt className="text-[var(--color-text-muted)]">Data de cadastro</dt><dd>{new Date(marmitaria.createdAt).toLocaleDateString('pt-BR')}</dd></div>
            {addr && (
              <div>
                <dt className="text-[var(--color-text-muted)]">Endereço</dt>
                <dd>
                  {[addr.street, addr.number, addr.complement, addr.neighborhood, addr.city, addr.state]
                    .filter(Boolean)
                    .join(', ')}
                  {addr.zipCode && ` — CEP: ${addr.zipCode}`}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {isRejected && marmitaria.lastAction?.metadata && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20 p-4">
          <h3 className="font-semibold text-red-800 dark:text-red-400">Motivo da Rejeição</h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {(marmitaria.lastAction.metadata as Record<string, string>).motivo ?? 'Motivo não informado'}
          </p>
          <p className="mt-1 text-xs text-red-500">
            Em {new Date(marmitaria.lastAction.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
      )}

      {isPending && (
        <div className="flex gap-3 pt-4 border-t border-[var(--color-border-raw)]">
          <Button variant="default" size="md" onClick={() => setApproveOpen(true)}>
            <CheckCircle className="h-4 w-4 mr-1" /> Aprovar
          </Button>
          <Button variant="destructive" size="md" onClick={() => setRejectOpen(true)}>
            <XCircle className="h-4 w-4 mr-1" /> Rejeitar
          </Button>
        </div>
      )}

      <ModerationDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Aprovar Marmitaria"
        description={`Aprovar o cadastro de "${marmitaria.tradeName}"? Um e-mail de boas-vindas será enviado ao responsável.`}
        confirmLabel="Aprovar"
        onConfirm={handleApprove}
        isLoading={loading}
        minMotivo={0}
        motivoLabel="Observações (opcional)"
        motivoPlaceholder="Observações sobre a aprovação..."
      />

      <ModerationDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Rejeitar Marmitaria"
        description={`Rejeitar o cadastro de "${marmitaria.tradeName}"? Um e-mail com o motivo será enviado ao responsável.`}
        confirmLabel="Rejeitar"
        variant="destructive"
        onConfirm={handleReject}
        isLoading={loading}
        minMotivo={20}
        motivoLabel="Motivo da rejeição"
        motivoPlaceholder="Explique o motivo da rejeição (mín. 20 caracteres)..."
      />
    </div>
  )
}
