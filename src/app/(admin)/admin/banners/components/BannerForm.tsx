'use client'

/**
 * BannerForm — Formulário de criação/edição de campanha de banner (Admin).
 * Campos: título, tipo, anunciante, imagem, URL, posição, período, prioridade, nota.
 * Validação Zod + react-hook-form. Preview ao vivo via BannerPreview.
 * @see module-17-banners-system/TASK-1/ST002
 */

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BannerPreview } from './BannerPreview'

const POSITION_LABELS = { TOP: 'Topo (16:3)', SIDEBAR: 'Lateral (1:3)', INLINE: 'Inline (1:1)' }
const TYPE_LABELS = { PAID: 'Pago (externo)', FREE_RESTAURANT: 'Crédito restaurante', PERMUTA: 'Permuta' }

const schema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres').max(255),
  type: z.enum(['PAID', 'FREE_RESTAURANT', 'PERMUTA']),
  imageUrl: z.string().url('URL de imagem inválida'),
  linkUrl: z.string().url('URL inválida').refine((v) => v.startsWith('https://'), 'URL deve usar HTTPS.'),
  position: z.enum(['TOP', 'SIDEBAR', 'INLINE']),
  priority: z.number().int().min(1).max(999),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  internalNote: z.string().max(1000).optional(),
})

type FormValues = z.infer<typeof schema>

interface BannerFormProps {
  mode?: 'create' | 'edit'
  defaultValues?: Partial<FormValues>
  campaignId?: string
  onSuccess?: () => void
}

export function BannerForm({ mode = 'create', defaultValues, campaignId, onSuccess }: BannerFormProps) {
  const router = useRouter()
  const [uploading, setUploading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'PAID',
      position: 'TOP',
      priority: 100,
      ...defaultValues,
    },
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form
  const imageUrl = watch('imageUrl')
  const position = watch('position')
  const title = watch('title')

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/v1/admin/banners/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setValue('imageUrl', data.url, { shouldValidate: true })
        toast.success('Imagem enviada com sucesso.')
      } else {
        toast.error(data.message ?? 'Falha no upload.')
      }
    } catch {
      toast.error('Erro ao enviar imagem.')
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      const url = mode === 'edit' && campaignId
        ? `/api/v1/admin/banners/${campaignId}`
        : '/api/v1/admin/banners'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message ?? 'Erro ao salvar campanha.')
        return
      }

      toast.success(mode === 'edit' ? 'Campanha atualizada.' : 'Campanha criada com status Pendente.')
      onSuccess?.()
      router.push('/admin/banners')
    } catch {
      toast.error('Erro ao salvar campanha.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Formulário */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="title">Título da campanha *</Label>
          <Input id="title" {...register('title')} placeholder="Ex: Campanha Primavera 2026" />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Tipo *</Label>
            <Select defaultValue="PAID" onValueChange={(v) => setValue('type', v as FormValues['type'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Posição *</Label>
            <Select defaultValue="TOP" onValueChange={(v) => setValue('position', v as FormValues['position'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(POSITION_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="imageUpload">Imagem do banner *</Label>
          <input
            id="imageUpload"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-[var(--color-text-secondary)] file:mr-4 file:rounded file:border-0 file:bg-[var(--color-surface)] file:px-3 file:py-1 file:text-sm"
          />
          {uploading && <p className="text-xs text-[var(--color-text-muted)]">Enviando…</p>}
          <Input {...register('imageUrl')} placeholder="ou cole a URL da imagem" className="mt-1" />
          {errors.imageUrl && <p className="text-xs text-red-500">{errors.imageUrl.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="linkUrl">URL de destino (HTTPS) *</Label>
          <Input id="linkUrl" {...register('linkUrl')} placeholder="https://exemplo.com" />
          {errors.linkUrl && <p className="text-xs text-red-500">{errors.linkUrl.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="startDate">Início</Label>
            <Input id="startDate" type="date" {...register('startDate')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endDate">Fim</Label>
            <Input id="endDate" type="date" {...register('endDate')} />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="priority">Prioridade (1=máx, 999=mín)</Label>
          <Input
            id="priority"
            type="number"
            min={1}
            max={999}
            {...register('priority', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="internalNote">Nota interna</Label>
          <Input id="internalNote" {...register('internalNote')} placeholder="Observações internas..." />
        </div>

        <Button type="submit" disabled={submitting || uploading} className="w-full">
          {submitting ? 'Salvando…' : mode === 'edit' ? 'Atualizar campanha' : 'Criar campanha'}
        </Button>
      </form>

      {/* Preview */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Pré-visualização ao vivo</h3>
        <BannerPreview
          imageUrl={imageUrl || null}
          position={position as 'TOP' | 'SIDEBAR' | 'INLINE'}
          title={title || ''}
        />
      </div>
    </div>
  )
}
