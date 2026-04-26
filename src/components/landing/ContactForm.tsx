'use client'

/**
 * ContactForm — formulário de contato para parceiros na landing page.
 * Client Component: usa react-hook-form + Zod.
 * POST /api/v1/contact — envia email ao admin via Resend.
 * @see intake-review/TASK-14/ST002
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const contactSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório (mínimo 2 caracteres)'),
  email: z.string().email('E-mail inválido'),
  tipo: z.enum(['MARMITARIA', 'RESTAURANTE', 'ONG', 'PATROCINADOR', 'OUTRO'], {
    errorMap: () => ({ message: 'Selecione o tipo de parceria' }),
  }),
  mensagem: z.string().min(10, 'Mensagem muito curta (mínimo 10 caracteres)').max(1000, 'Máximo 1000 caracteres'),
})

type ContactFormData = z.infer<typeof contactSchema>

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error'

export function ContactForm() {
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  async function onSubmit(data: ContactFormData) {
    setStatus('loading')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.status === 429) {
        setErrorMsg('Muitas solicitações. Aguarde um momento antes de enviar novamente.')
        setStatus('error')
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setErrorMsg(body?.message ?? 'Erro ao enviar. Tente novamente.')
        setStatus('error')
        return
      }

      setStatus('success')
      reset()
    } catch {
      setErrorMsg('Falha de conexão. Verifique sua internet e tente novamente.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        data-testid="contact-form-success"
        role="status"
        className="rounded-lg bg-green-50 border border-green-200 p-6 text-center"
      >
        <p className="text-green-800 font-semibold text-lg">Mensagem enviada!</p>
        <p className="text-green-700 text-sm mt-1">
          Entraremos em contato em breve. Obrigado pelo interesse em ser parceiro!
        </p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-green-700 underline underline-offset-2 hover:text-green-900"
        >
          Enviar outra mensagem
        </button>
      </div>
    )
  }

  return (
    <form
      data-testid="contact-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Nome */}
        <div>
          <label htmlFor="contact-nome" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            Nome <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="contact-nome"
            type="text"
            autoComplete="name"
            {...register('nome')}
            aria-describedby={errors.nome ? 'contact-nome-error' : undefined}
            aria-invalid={!!errors.nome}
            className="w-full rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-green-500 aria-[invalid=true]:border-red-400"
            placeholder="Seu nome"
          />
          {errors.nome && (
            <p id="contact-nome-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.nome.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            E-mail <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            {...register('email')}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            aria-invalid={!!errors.email}
            className="w-full rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-green-500 aria-[invalid=true]:border-red-400"
            placeholder="seu@email.com"
          />
          {errors.email && (
            <p id="contact-email-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label htmlFor="contact-tipo" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Tipo de Parceria <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <select
          id="contact-tipo"
          {...register('tipo')}
          aria-describedby={errors.tipo ? 'contact-tipo-error' : undefined}
          aria-invalid={!!errors.tipo}
          className="w-full rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-green-500 aria-[invalid=true]:border-red-400"
        >
          <option value="">Selecione...</option>
          <option value="MARMITARIA">Marmitaria</option>
          <option value="RESTAURANTE">Restaurante</option>
          <option value="ONG">ONG / Associação</option>
          <option value="PATROCINADOR">Patrocinador / Empresa</option>
          <option value="OUTRO">Outro</option>
        </select>
        {errors.tipo && (
          <p id="contact-tipo-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.tipo.message}
          </p>
        )}
      </div>

      {/* Mensagem */}
      <div>
        <label htmlFor="contact-mensagem" className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Mensagem <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <textarea
          id="contact-mensagem"
          rows={4}
          {...register('mensagem')}
          aria-describedby={errors.mensagem ? 'contact-mensagem-error' : undefined}
          aria-invalid={!!errors.mensagem}
          className="w-full rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-green-500 resize-none aria-[invalid=true]:border-red-400"
          placeholder="Conte-nos sobre sua parceria..."
        />
        {errors.mensagem && (
          <p id="contact-mensagem-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.mensagem.message}
          </p>
        )}
      </div>

      {/* Erro global */}
      {status === 'error' && errorMsg && (
        <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        data-testid="contact-form-submit"
        className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-lg bg-green-700 px-8 text-sm font-semibold text-white hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {status === 'loading' ? (
          <>
            <svg
              aria-hidden="true"
              className="mr-2 h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Enviando...
          </>
        ) : (
          'Enviar Mensagem'
        )}
      </button>
    </form>
  )
}
