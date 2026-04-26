'use client'

/**
 * CookieBanner — banner LGPD com opcoes granulares.
 * @see intake-review/TASK-5/ST002 — CL-279
 */

import { useEffect, useState } from 'react'
import {
  type ConsentCategories,
  type Consent,
  CONSENT_VERSION,
  acceptAll,
  hasDecided,
  rejectOptional,
  setConsent,
} from '@/lib/cookies/consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)
  const [cats, setCats] = useState<ConsentCategories>({
    essential: true,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    if (!hasDecided()) setVisible(true)
  }, [])

  async function logToServer(c: Consent) {
    try {
      await fetch('/api/v1/lgpd/cookie-consent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(c),
      })
    } catch {
      // silencioso — usuario nao autenticado ou offline
    }
  }

  function handleAcceptAll() {
    const c = acceptAll()
    setVisible(false)
    void logToServer(c)
  }

  function handleRejectOptional() {
    const c = rejectOptional()
    setVisible(false)
    void logToServer(c)
  }

  function handleSavePrefs() {
    const c: Consent = {
      categories: { essential: true, analytics: cats.analytics, marketing: cats.marketing },
      version: CONSENT_VERSION,
      at: new Date().toISOString(),
    }
    setConsent(c)
    setShowPrefs(false)
    setVisible(false)
    void logToServer(c)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-4 shadow-lg dark:bg-neutral-900"
    >
      {!showPrefs ? (
        <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="cookie-title" className="font-semibold">
              Cookies e privacidade
            </h2>
            <p id="cookie-desc" className="text-sm text-muted-foreground">
              Usamos cookies essenciais para o site funcionar. Podemos usar cookies de analise e marketing se voce permitir.{' '}
              <a href="/privacidade" className="underline">
                Politica de privacidade
              </a>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRejectOptional}
              className="rounded border px-3 py-2 text-sm"
            >
              Apenas essenciais
            </button>
            <button
              type="button"
              onClick={() => setShowPrefs(true)}
              className="rounded border px-3 py-2 text-sm"
            >
              Personalizar
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              Aceitar todos
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-5xl space-y-3">
          <h2 className="font-semibold">Preferencias de cookies</h2>
          <fieldset className="space-y-2">
            <label className="flex items-start gap-2">
              <input type="checkbox" checked disabled />
              <span>
                <strong>Essenciais</strong> (sempre ativos) — necessarios para login e funcionamento basico.
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={cats.analytics}
                onChange={(e) => setCats({ ...cats, analytics: e.target.checked })}
              />
              <span>
                <strong>Analise</strong> — nos ajudam a entender como o site e usado.
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={cats.marketing}
                onChange={(e) => setCats({ ...cats, marketing: e.target.checked })}
              />
              <span>
                <strong>Marketing</strong> — personalizacao de conteudo e campanhas.
              </span>
            </label>
          </fieldset>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowPrefs(false)} className="rounded border px-3 py-2 text-sm">
              Voltar
            </button>
            <button
              type="button"
              onClick={handleSavePrefs}
              className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              Salvar preferencias
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
