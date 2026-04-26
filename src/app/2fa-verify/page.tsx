'use client'

/**
 * 2FA verify page — input TOTP ou backup code.
 * @see intake-review/TASK-2/ST005 — CL-265
 */

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function TwoFactorVerifyPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [token, setToken] = useState('')
  const [useBackup, setUseBackup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit() {
    setError(null)
    setPending(true)
    try {
      const res = await fetch('/api/v1/admin/2fa/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message ?? 'Codigo invalido')
      }
      const next = params.get('next') ?? '/admin'
      router.push(next)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">Confirme sua identidade</h1>
      <p>{useBackup ? 'Informe um backup code.' : 'Informe o codigo de 6 digitos do seu app autenticador.'}</p>
      <label className="block">
        <span className="text-sm font-medium">{useBackup ? 'Backup code' : 'Codigo'}</span>
        <input
          type="text"
          inputMode={useBackup ? 'text' : 'numeric'}
          pattern={useBackup ? undefined : '[0-9]{6}'}
          maxLength={useBackup ? 32 : 6}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
          autoComplete="one-time-code"
          autoFocus
        />
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={pending || token.length < 6}
        className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Verificando...' : 'Entrar'}
      </button>
      <button type="button" onClick={() => setUseBackup((v) => !v)} className="text-sm underline">
        {useBackup ? 'Voltar a usar app autenticador' : 'Usar backup code'}
      </button>
    </main>
  )
}
