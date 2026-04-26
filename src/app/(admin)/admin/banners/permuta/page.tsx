'use client'
export const dynamic = 'force-dynamic'

/**
 * /admin/banners/permuta — Gestão de acordos de permuta com plataformas solidárias.
 * @see module-17-banners-system/TASK-5/ST002
 */

import * as React from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const schema = z.object({
  title: z.string().min(3).max(255),
  imageUrl: z.string().url('URL inválida'),
  linkUrl: z.string().url().refine((v) => v.startsWith('https://'), 'URL deve usar HTTPS.'),
  position: z.enum(['TOP', 'SIDEBAR', 'INLINE']),
  permutaPartnerUrl: z.string().url().refine((v) => v.startsWith('https://'), 'URL do parceiro deve usar HTTPS.'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface PermutaCampaign {
  id: string
  title: string
  status: string
  position: string
  permutaPartnerUrl: string | null
  startDate: string | null
  endDate: string | null
}

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  DRAFT:    { label: 'Rascunho', variant: 'secondary' },
  ACTIVE:   { label: 'Ativo',    variant: 'default' },
  PAUSED:   { label: 'Pausado',  variant: 'outline' },
  REJECTED: { label: 'Removido', variant: 'destructive' },
}

export default function AdminPermutaPage() {
  const [campaigns, setCampaigns] = React.useState<PermutaCampaign[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null)
  const [deleteReason, setDeleteReason] = React.useState('')
  const [deleting, setDeleting] = React.useState(false)

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { position: 'TOP' },
  })

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/admin/banners/permuta')
      const data = await res.json()
      setCampaigns(data.data ?? [])
    } catch {
      toast.error('Erro ao carregar acordos de permuta.')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [])

  async function onSubmit(values: FormValues) {
    const res = await fetch('/api/v1/admin/banners/permuta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (res.ok) {
      toast.success('Acordo de permuta criado.')
      setSheetOpen(false)
      reset()
      load()
    } else {
      const d = await res.json()
      toast.error(d.message ?? 'Erro ao criar acordo.')
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleteReason.trim().length < 10) {
      toast.error('Motivo deve ter no mínimo 10 caracteres.')
      return
    }
    setDeleting(true)
    const res = await fetch(`/api/v1/admin/banners/permuta/${deleteTarget}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: deleteReason }),
    })
    if (res.status === 204) {
      toast.success('Acordo removido.')
      setDeleteTarget(null)
      setDeleteReason('')
      load()
    } else {
      const d = await res.json()
      toast.error(d.message ?? 'Erro ao remover.')
    }
    setDeleting(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/banners" className="text-sm text-[var(--color-text-secondary)] hover:underline flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Voltar para banners
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Acordos de Permuta</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Troca de espaço publicitário com plataformas solidárias — custo zero, peso 30% na rotação.
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger>
            <Button size="sm" onClick={() => setSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo acordo
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Novo acordo de permuta</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div className="space-y-1">
                <Label>Nome do parceiro *</Label>
                <Input {...register('title')} placeholder="Ex: Banco de Alimentos SP" />
                {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>URL do banner do parceiro (imagem) *</Label>
                <Input {...register('imageUrl')} placeholder="https://..." />
                {errors.imageUrl && <p className="text-xs text-red-500">{errors.imageUrl.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>URL de destino ao clicar (HTTPS) *</Label>
                <Input {...register('linkUrl')} placeholder="https://parceiro.org" />
                {errors.linkUrl && <p className="text-xs text-red-500">{errors.linkUrl.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>URL onde exibimos nosso banner no parceiro *</Label>
                <Input {...register('permutaPartnerUrl')} placeholder="https://parceiro.org/pagina" />
                {errors.permutaPartnerUrl && <p className="text-xs text-red-500">{errors.permutaPartnerUrl.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Posição *</Label>
                <Select defaultValue="TOP" onValueChange={(v) => setValue('position', v as FormValues['position'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOP">Topo (16:3)</SelectItem>
                    <SelectItem value="SIDEBAR">Lateral (1:3)</SelectItem>
                    <SelectItem value="INLINE">Inline (1:1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Início</Label>
                  <Input type="date" {...register('startDate')} />
                </div>
                <div className="space-y-1">
                  <Label>Fim</Label>
                  <Input type="date" {...register('endDate')} />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Criando…' : 'Criar acordo de permuta'}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-[var(--color-border-raw)]">
          <p className="text-sm text-[var(--color-text-muted)]">Nenhum acordo de permuta cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => {
            const statusInfo = STATUS_BADGE[c.status] ?? { label: c.status, variant: 'secondary' as const }
            return (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--color-text-primary)]">{c.title}</p>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    <span className="text-xs text-[var(--color-text-muted)]">{c.position}</span>
                  </div>
                  {c.permutaPartnerUrl && (
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)] truncate max-w-xs">
                      Parceiro: {c.permutaPartnerUrl}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(c.id)}
                  aria-label="Remover acordo"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteReason('') } }}
        title="Remover acordo de permuta?"
        description={
          <div className="space-y-2">
            <p>O banner será removido imediatamente da rotação.</p>
            <Input
              placeholder="Motivo da remoção (mínimo 10 caracteres)"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
          </div>
        }
        confirmLabel="Confirmar remoção"
        variant="destructive"
        onConfirm={confirmDelete}
        isLoading={deleting}
      />
    </div>
  )
}
