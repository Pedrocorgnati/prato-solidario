'use client'

/**
 * BannerScheduleForm — formulário de agendamento de campanha de banner.
 * Client Component com react-hook-form + Zod.
 * @see intake-review/TASK-18/ST002
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar } from 'lucide-react'

const scheduleSchema = z.object({
  titulo: z.string().min(3, 'Título obrigatório (mín. 3 caracteres)').max(80),
  descricao: z.string().min(10, 'Descrição obrigatória (mín. 10 caracteres)').max(300),
  dataInicio: z.string().min(1, 'Data de início obrigatória'),
  dataFim: z.string().min(1, 'Data de fim obrigatória'),
  orcamento: z.number({ invalid_type_error: 'Orçamento inválido' }).min(10, 'Mínimo R$ 10,00'),
}).refine((data) => new Date(data.dataFim) > new Date(data.dataInicio), {
  message: 'Data de fim deve ser posterior ao início',
  path: ['dataFim'],
})

type ScheduleFormData = z.infer<typeof scheduleSchema>

interface BannerScheduleFormProps {
  onSuccess?: (data: ScheduleFormData) => void
  className?: string
}

export function BannerScheduleForm({ onSuccess, className }: BannerScheduleFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
  })

  async function onSubmit(data: ScheduleFormData) {
    setStatus('loading')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/v1/banners/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setErrorMsg(body?.message ?? 'Erro ao agendar campanha.')
        setStatus('error')
        return
      }

      setStatus('success')
      reset()
      onSuccess?.(data)
    } catch {
      setErrorMsg('Falha de conexão.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        data-testid="banner-schedule-success"
        role="status"
        className="rounded-lg bg-green-50 border border-green-200 p-6 text-center"
      >
        <p className="text-green-800 font-semibold">Campanha agendada com sucesso!</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-3 text-sm text-green-700 underline underline-offset-2"
        >
          Agendar outra
        </button>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <form
      data-testid="banner-schedule-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={`space-y-4 ${className ?? ''}`}
    >
      <div>
        <label htmlFor="bs-titulo" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Título da campanha <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id="bs-titulo"
          type="text"
          {...register('titulo')}
          aria-invalid={!!errors.titulo}
          className="w-full rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 aria-[invalid=true]:border-red-400"
          placeholder="Ex: Promoção de fim de semana"
        />
        {errors.titulo && <p role="alert" className="mt-1 text-xs text-red-600">{errors.titulo.message}</p>}
      </div>

      <div>
        <label htmlFor="bs-descricao" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Descrição <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <textarea
          id="bs-descricao"
          rows={3}
          {...register('descricao')}
          aria-invalid={!!errors.descricao}
          className="w-full rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none aria-[invalid=true]:border-red-400"
          placeholder="Descreva sua campanha..."
        />
        {errors.descricao && <p role="alert" className="mt-1 text-xs text-red-600">{errors.descricao.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bs-dataInicio" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            Data início <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="bs-dataInicio"
            type="date"
            min={today}
            {...register('dataInicio')}
            aria-invalid={!!errors.dataInicio}
            className="w-full rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 aria-[invalid=true]:border-red-400"
          />
          {errors.dataInicio && <p role="alert" className="mt-1 text-xs text-red-600">{errors.dataInicio.message}</p>}
        </div>

        <div>
          <label htmlFor="bs-dataFim" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            Data fim <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="bs-dataFim"
            type="date"
            min={today}
            {...register('dataFim')}
            aria-invalid={!!errors.dataFim}
            className="w-full rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 aria-[invalid=true]:border-red-400"
          />
          {errors.dataFim && <p role="alert" className="mt-1 text-xs text-red-600">{errors.dataFim.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="bs-orcamento" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Orçamento (R$) <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          id="bs-orcamento"
          type="number"
          min="10"
          step="0.01"
          {...register('orcamento', { valueAsNumber: true })}
          aria-invalid={!!errors.orcamento}
          className="w-full rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 aria-[invalid=true]:border-red-400"
          placeholder="50.00"
        />
        {errors.orcamento && <p role="alert" className="mt-1 text-xs text-red-600">{errors.orcamento.message}</p>}
      </div>

      {status === 'error' && errorMsg && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        data-testid="banner-schedule-submit"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-6 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
      >
        <Calendar className="h-4 w-4" aria-hidden="true" />
        {status === 'loading' ? 'Agendando...' : 'Agendar Campanha'}
      </button>
    </form>
  )
}
