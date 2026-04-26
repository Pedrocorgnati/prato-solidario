'use client'
export const dynamic = 'force-dynamic'

/**
 * /doador/campanhas/nova — Formulário para agendar nova campanha de banner.
 * Exibe saldo disponível + preview em tempo real + upload de imagem.
 * @see module-17-banners-system/TASK-3/ST002
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, Upload, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ASPECT_RATIOS: Record<string, string> = {
  TOP:     'aspect-[16/3]',
  SIDEBAR: 'aspect-[1/3]',
  INLINE:  'aspect-square',
}

const schema = z.object({
  title:    z.string().min(3).max(255),
  imageUrl: z.string().url('URL inválida'),
  linkUrl:  z.string().url().refine((v) => v.startsWith('https://'), 'URL deve usar HTTPS.'),
  position: z.enum(['TOP', 'SIDEBAR', 'INLINE']),
  startDate: z.string().optional(),
  endDate:   z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface CreditBalance {
  daysAvailable: number
  daysUsed: number
}

function getAuthToken(): string | undefined {
  return document.cookie
    .split('; ')
    .find((r) => r.startsWith('sb-access-token='))
    ?.split('=')[1]
}

export default function NovaCampanhaPage() {
  const router = useRouter()
  const [balance, setBalance] = React.useState<CreditBalance | null>(null)
  const [loadingBalance, setLoadingBalance] = React.useState(true)
  const [uploading, setUploading] = React.useState(false)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { position: 'TOP' },
  })

  const position = watch('position')
  const imageUrl = watch('imageUrl')

  // Sync previewUrl with imageUrl field
  React.useEffect(() => {
    if (imageUrl && imageUrl.startsWith('https://')) setPreviewUrl(imageUrl)
  }, [imageUrl])

  React.useEffect(() => {
    async function loadBalance() {
      setLoadingBalance(true)
      try {
        const token = getAuthToken()
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch('/api/v1/banners/my-credit', { headers })
        if (res.ok) {
          const json = await res.json()
          setBalance(json.data ?? json)
        }
      } catch {
        toast.error('Não foi possível carregar o saldo de dias.')
      } finally {
        setLoadingBalance(false)
      }
    }
    loadBalance()
  }, [])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 2 MB.')
      return
    }

    setUploading(true)
    try {
      const token = getAuthToken()
      const formData = new FormData()
      formData.append('file', file)

      const headers: HeadersInit = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch('/api/v1/banners/upload', { method: 'POST', headers, body: formData })
      if (res.ok) {
        const data = await res.json()
        setValue('imageUrl', data.url)
        setPreviewUrl(data.url)
        toast.success('Imagem enviada.')
      } else {
        const d = await res.json()
        toast.error(d.message ?? 'Erro ao enviar imagem.')
      }
    } catch {
      toast.error('Erro ao enviar imagem.')
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(values: FormValues) {
    const token = getAuthToken()
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch('/api/v1/banners/schedule', {
      method: 'POST',
      headers,
      body: JSON.stringify(values),
    })

    if (res.ok) {
      toast.success('Campanha agendada com sucesso!')
      router.push('/doador/campanhas')
    } else {
      const d = await res.json()
      if (d.code === 'BAN_001') {
        toast.error('Saldo insuficiente. Complete mais doações para ganhar dias de banner.')
      } else {
        toast.error(d.message ?? 'Erro ao agendar campanha.')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/doador/campanhas" className="text-sm text-[var(--color-text-secondary)] hover:underline flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" />
          Minhas campanhas
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Nova campanha de banner</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Seu banner aparecerá na plataforma por tantos dias quantos você selecionar.
        </p>
      </div>

      {/* Saldo */}
      {loadingBalance ? (
        <Skeleton className="h-16 w-full" />
      ) : balance !== null ? (
        <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-[var(--color-primary-raw)]" />
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Saldo disponível:&nbsp;
              <span className="text-[var(--color-primary-raw)] font-bold">
                {balance.daysAvailable} {balance.daysAvailable === 1 ? 'dia' : 'dias'}
              </span>
            </p>
          </div>
          {balance.daysAvailable === 0 && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Complete mais doações para ganhar dias de banner.
            </p>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome da campanha *</Label>
            <Input {...register('title')} placeholder="Ex: Promoção de Março" />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Imagem do banner *</Label>
            <div className="flex gap-2">
              <Input {...register('imageUrl')} placeholder="https://..." className="flex-1" />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-1" />
                    {uploading ? 'Enviando…' : 'Enviar'}
                  </span>
                </Button>
              </label>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">JPEG ou PNG, máx. 2 MB</p>
            {errors.imageUrl && <p className="text-xs text-red-500">{errors.imageUrl.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>URL de destino ao clicar (HTTPS) *</Label>
            <Input {...register('linkUrl')} placeholder="https://meurestaurante.com.br" />
            {errors.linkUrl && <p className="text-xs text-red-500">{errors.linkUrl.message}</p>}
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
              <Label>Data de início</Label>
              <Input type="date" {...register('startDate')} />
            </div>
            <div className="space-y-1">
              <Label>Data de fim</Label>
              <Input type="date" {...register('endDate')} />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || balance?.daysAvailable === 0}
            className="w-full"
          >
            {isSubmitting ? 'Agendando…' : 'Agendar campanha'}
          </Button>
        </form>

        {/* Preview */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">Pré-visualização</p>
          <div className={`relative w-full overflow-hidden rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-surface)] ${ASPECT_RATIOS[position] ?? 'aspect-video'}`}>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview do banner"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-[var(--color-text-muted)]">Adicione a URL ou faça upload da imagem</p>
              </div>
            )}
            <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
              Publicidade
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            Proporção {position === 'TOP' ? '16:3 (topo)' : position === 'SIDEBAR' ? '1:3 (lateral)' : '1:1 (inline)'}
          </p>
        </div>
      </div>
    </div>
  )
}
