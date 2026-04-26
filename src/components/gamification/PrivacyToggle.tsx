'use client'

/**
 * PrivacyToggle — toggle de opt-in no Hall da Fama público.
 *
 * Client Component. Usa estado otimista com rollback em erro.
 * Debounce de 300ms para evitar dupla requisição por clique rápido.
 *
 * @see module-20-gamificacao/TASK-3/ST004
 */

import { useState, useRef } from 'react'
import { updateHallOfFameOptIn } from '@/actions/gamification'
import { useToast } from '@/hooks/useToast'

interface PrivacyToggleProps {
  initialEnabled: boolean
}

export function PrivacyToggle({ initialEnabled }: PrivacyToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [pending, setPending] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const pendingValue = useRef<boolean | null>(null)
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleToggle() {
    if (pending) return

    const next = !enabled

    // Debounce 300ms
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (next) {
        // Ativar: pede confirmação
        pendingValue.current = next
        setShowConfirm(true)
      } else {
        // Desativar: sem confirmação
        executeToggle(next)
      }
    }, 300)
  }

  async function executeToggle(next: boolean) {
    // Estado otimista
    setEnabled(next)
    setPending(true)

    const res = await updateHallOfFameOptIn(next)

    if (res.error) {
      // Rollback
      setEnabled(!next)
      toastError(res.error)
    } else if (next) {
      toastSuccess('Preferência salva. Você agora aparece no Hall da Fama.')
    } else {
      toastInfo('Seu nome será removido do ranking em até 24h.')
    }

    setPending(false)
    setShowConfirm(false)
    pendingValue.current = null
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl border border-[var(--color-border-raw)] bg-[var(--color-surface-raw)]">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            Aparecer no Hall da Fama público
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Seu nome aparecerá anonimizado (ex: &ldquo;João S.&rdquo;)
          </p>
        </div>

        {/* shadcn/ui Switch emulado sem dependência adicional */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Aparecer no Hall da Fama público"
          disabled={pending}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
            ${enabled ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-muted-raw)]'}`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200
              ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {/* Modal de confirmação ao ativar */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
          <div className="bg-[var(--color-surface-raw)] rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <h2 id="confirm-title" className="text-base font-semibold text-[var(--color-text-primary)]">
              Aparecer no ranking público?
            </h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Seu nome aparecerá como &ldquo;João S.&rdquo; no ranking público. Nunca exibimos seu nome
              completo, e-mail ou informações pessoais.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false)
                  pendingValue.current = null
                }}
                className="flex-1 rounded-lg border border-[var(--color-border-raw)] py-2 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-muted-raw)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => executeToggle(true)}
                className="flex-1 rounded-lg bg-[var(--color-primary)] py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
