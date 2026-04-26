'use client'

/**
 * PauseCard — permite a marmitaria pausar/retomar recebimento de patrocinios.
 * @see intake-review/TASK-1/ST005 — CL-262
 */

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

interface PauseCardProps {
  initialPaused: boolean
  initialPausedAt: string | null
}

export function PauseCard({ initialPaused, initialPausedAt }: PauseCardProps) {
  const [isPaused, setIsPaused] = useState(initialPaused)
  const [pausedAt, setPausedAt] = useState(initialPausedAt)
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  async function doPause() {
    setConfirming(false)
    startTransition(async () => {
      try {
        const res = await fetch('/api/v1/marmitarias/settings/pause', { method: 'POST' })
        if (!res.ok) throw new Error('Falha ao pausar')
        const data = await res.json()
        setIsPaused(true)
        setPausedAt(data.pausedAt)
        toast.success('Marmitaria pausada. Voce nao recebera novos patrocinios.')
      } catch (err) {
        toast.error('Nao foi possivel pausar. Tente novamente.')
      }
    })
  }

  async function doResume() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/v1/marmitarias/settings/pause', { method: 'DELETE' })
        if (!res.ok) throw new Error('Falha ao retomar')
        setIsPaused(false)
        setPausedAt(null)
        toast.success('Marmitaria ativa novamente.')
      } catch (err) {
        toast.error('Nao foi possivel retomar. Tente novamente.')
      }
    })
  }

  return (
    <section aria-labelledby="pause-title" className="rounded-lg border p-4">
      <h2 id="pause-title" className="text-lg font-semibold">
        {isPaused ? 'Marmitaria pausada' : 'Marmitaria ativa'}
      </h2>
      {isPaused && pausedAt && (
        <p className="text-sm text-muted-foreground">
          Pausada desde {new Date(pausedAt).toLocaleString('pt-BR')}
        </p>
      )}
      <p className="mt-2 text-sm">
        {isPaused
          ? 'Enquanto pausada, voce NAO recebe novos patrocinios. Refeicoes ja geradas continuam disponiveis para retirada.'
          : 'Use esta opcao se precisa pausar o recebimento de patrocinios (ferias, reforma, etc).'}
      </p>

      {!isPaused && !confirming && (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={pending}
          className="mt-4 rounded bg-yellow-600 px-4 py-2 text-white disabled:opacity-50"
        >
          Pausar marmitaria
        </button>
      )}

      {!isPaused && confirming && (
        <div className="mt-4 space-y-2" role="alertdialog" aria-label="Confirmar pausa">
          <p className="font-medium">
            Tem certeza? Voce deixara de receber novos patrocinios ate retomar.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={doPause} disabled={pending} className="rounded bg-yellow-600 px-4 py-2 text-white disabled:opacity-50">
              {pending ? 'Pausando...' : 'Sim, pausar'}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded border px-4 py-2">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {isPaused && (
        <button
          type="button"
          onClick={doResume}
          disabled={pending}
          className="mt-4 rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {pending ? 'Retomando...' : 'Retomar atividade'}
        </button>
      )}
    </section>
  )
}
