'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ModerationDialog } from '@/components/admin/ModerationDialog'
import { useToast } from '@/hooks/useToast'
import {
  startInvestigation,
  warnUser,
  suspendUserFromIncident,
  resolveIncident,
  saveInvestigationNotes,
} from '@/actions/admin-incidents.actions'
import { ArrowLeft, Search, AlertTriangle, Ban, CheckCircle, Save } from 'lucide-react'
import type { AdminIncidentDetail, AdminIncidentTimelineEntry } from '@/types/admin-gestao'

interface Props {
  incident: AdminIncidentDetail
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto',
  INVESTIGATING: 'Em investigação',
  RESOLVED: 'Resolvido',
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-800',
  INVESTIGATING: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
}

const TYPE_COLORS: Record<string, string> = {
  ABUSE: 'bg-red-100 text-red-800',
  FRAUD: 'bg-purple-100 text-purple-800',
  QUALITY: 'bg-yellow-100 text-yellow-800',
  NO_SHOW: 'bg-orange-100 text-orange-800',
}

type DialogAction = 'investigate' | 'warn' | 'suspend' | 'resolve'

export function IncidenteDetailClient({ incident }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogAction, setDialogAction] = React.useState<DialogAction>('investigate')
  const [loading, setLoading] = React.useState(false)
  const [notes, setNotes] = React.useState('')
  const [savingNotes, setSavingNotes] = React.useState(false)

  const isResolved = incident.status === 'RESOLVED'
  const isOpen = incident.status === 'OPEN'

  function openAction(action: DialogAction) {
    setDialogAction(action)
    setDialogOpen(true)
  }

  async function handleConfirm(motivo: string) {
    setLoading(true)
    try {
      let result: { success: boolean; error?: string }
      switch (dialogAction) {
        case 'investigate':
          result = await startInvestigation(incident.id, motivo || undefined)
          break
        case 'warn':
          result = await warnUser(incident.id, motivo)
          break
        case 'suspend':
          result = await suspendUserFromIncident(incident.id, motivo)
          break
        case 'resolve':
          result = await resolveIncident(incident.id, motivo || undefined)
          break
      }

      if (result.success) {
        const msgs: Record<DialogAction, string> = {
          investigate: 'Investigação iniciada',
          warn: 'Usuário advertido',
          suspend: 'Usuário suspenso',
          resolve: 'Incidente resolvido',
        }
        toast.success(msgs[dialogAction])
        setDialogOpen(false)
        router.refresh()
      } else {
        toast.error(`Erro: ${result.error}`)
      }
    } catch {
      toast.error('Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveNotes() {
    if (!notes.trim()) return
    setSavingNotes(true)
    try {
      const result = await saveInvestigationNotes(incident.id, notes.trim())
      if (result.success) {
        toast.success('Notas salvas')
        setNotes('')
        router.refresh()
      } else {
        toast.error(`Erro: ${result.error}`)
      }
    } catch {
      toast.error('Erro ao salvar notas')
    } finally {
      setSavingNotes(false)
    }
  }

  const dialogConfig: Record<DialogAction, { title: string; desc: string; label: string; variant: 'default' | 'destructive'; min: number }> = {
    investigate: { title: 'Iniciar Investigação', desc: 'Adicione notas para iniciar a investigação.', label: 'Iniciar', variant: 'default', min: 0 },
    warn: { title: 'Advertir Usuário', desc: 'Adicione notas sobre a advertência.', label: 'Advertir', variant: 'destructive', min: 10 },
    suspend: { title: 'Suspender Usuário', desc: 'Informe o motivo da suspensão.', label: 'Suspender', variant: 'destructive', min: 10 },
    resolve: { title: 'Resolver Incidente', desc: 'Adicione notas de resolução.', label: 'Resolver', variant: 'default', min: 0 },
  }

  const cfg = dialogConfig[dialogAction]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/incidentes')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Incidente <span className="font-mono text-base">{incident.id.slice(0, 8)}</span>
        </h1>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${TYPE_COLORS[incident.type] ?? ''}`}>
          {incident.type}
        </span>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[incident.status] ?? ''}`}>
          {STATUS_LABELS[incident.status] ?? incident.status}
        </span>
      </div>

      <div className="rounded-lg border border-[var(--color-border-raw)] p-4 space-y-2">
        <h2 className="font-semibold text-[var(--color-text-primary)]">Detalhes</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div><dt className="text-[var(--color-text-muted)]">Severidade</dt><dd>{incident.severity === 'HIGH' ? 'Alta' : incident.severity === 'MEDIUM' ? 'Média' : 'Baixa'}</dd></div>
          <div><dt className="text-[var(--color-text-muted)]">Data</dt><dd>{new Date(incident.createdAt).toLocaleString('pt-BR')}</dd></div>
          {incident.ipMasked && <div><dt className="text-[var(--color-text-muted)]">IP (mascarado)</dt><dd className="font-mono">{incident.ipMasked}</dd></div>}
          {incident.description && <div className="col-span-2"><dt className="text-[var(--color-text-muted)]">Descrição</dt><dd>{incident.description}</dd></div>}
        </dl>
      </div>

      {/* Timeline */}
      <div className="rounded-lg border border-[var(--color-border-raw)] p-4 space-y-4">
        <h2 className="font-semibold text-[var(--color-text-primary)]">Timeline</h2>
        {incident.timeline && incident.timeline.length > 0 ? (
          <div className="space-y-3">
            {incident.timeline.map((entry: AdminIncidentTimelineEntry) => (
              <div key={entry.id} className="flex gap-3 border-l-2 border-[var(--color-border-raw)] pl-4 py-1">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{entry.action}</p>
                  {entry.notes && <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{entry.notes}</p>}
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {entry.adminName ?? 'Admin'} — {new Date(entry.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Nenhuma ação registrada ainda.</p>
        )}
      </div>

      {/* Notes area */}
      {!isResolved && (
        <div className="rounded-lg border border-[var(--color-border-raw)] p-4 space-y-3">
          <h2 className="font-semibold text-[var(--color-text-primary)]">Notas de Investigação</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Adicione notas de investigação..."
            rows={3}
            maxLength={1000}
            className="w-full rounded-md border border-[var(--color-border-raw)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
          />
          <Button variant="outline" size="sm" onClick={handleSaveNotes} disabled={savingNotes || !notes.trim()}>
            <Save className="h-3.5 w-3.5 mr-1" /> {savingNotes ? 'Salvando...' : 'Salvar notas'}
          </Button>
        </div>
      )}

      {/* Actions */}
      {!isResolved && (
        <div className="flex flex-wrap gap-3 pt-4 border-t border-[var(--color-border-raw)]">
          {isOpen && (
            <Button variant="default" size="md" onClick={() => openAction('investigate')}>
              <Search className="h-4 w-4 mr-1" /> Iniciar Investigação
            </Button>
          )}
          <Button variant="outline" size="md" onClick={() => openAction('warn')}>
            <AlertTriangle className="h-4 w-4 mr-1" /> Advertir Usuário
          </Button>
          <Button variant="destructive" size="md" onClick={() => openAction('suspend')}>
            <Ban className="h-4 w-4 mr-1" /> Suspender Usuário
          </Button>
          <Button variant="default" size="md" onClick={() => openAction('resolve')}>
            <CheckCircle className="h-4 w-4 mr-1" /> Marcar como Resolvido
          </Button>
        </div>
      )}

      {isResolved && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20 p-4">
          <p className="text-sm font-medium text-green-800 dark:text-green-400">
            Incidente resolvido — somente leitura
          </p>
        </div>
      )}

      <ModerationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={cfg.title}
        description={cfg.desc}
        confirmLabel={cfg.label}
        variant={cfg.variant}
        onConfirm={handleConfirm}
        isLoading={loading}
        minMotivo={cfg.min}
        motivoLabel="Notas"
        motivoPlaceholder="Adicione notas sobre esta ação..."
      />
    </div>
  )
}
