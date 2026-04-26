'use client'

/**
 * Enrollment 2FA admin — QR code + input TOTP + backup codes.
 * @see intake-review/TASK-2/ST005 — CL-265
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function TwoFactorEnrollPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [otpauth, setOtpauth] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [totp, setTotp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [codes, setCodes] = useState<string[] | null>(null)
  const [acknowledgedCodes, setAcknowledgedCodes] = useState(false)

  useEffect(() => {
    fetch('/api/v1/admin/2fa/enroll')
      .then((r) => r.json())
      .then(async (d) => {
        setOtpauth(d.otpauth)
        try {
          const qr = await import('qrcode')
          const url = await qr.toDataURL(d.otpauth)
          setQrDataUrl(url)
        } catch {
          // qrcode ainda nao instalado; exibir URL textual como fallback
        }
      })
      .catch(() => setError('Nao foi possivel iniciar enrollment'))
  }, [])

  async function submit() {
    setError(null)
    setPending(true)
    try {
      const res = await fetch('/api/v1/admin/2fa/enroll', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ totp }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message ?? 'Codigo invalido')
      }
      const data = await res.json()
      setCodes(data.backupCodes)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPending(false)
    }
  }

  function finish() {
    const next = params.get('next') ?? '/admin'
    router.push(next)
  }

  function downloadCodes() {
    if (!codes) return
    const blob = new Blob([codes.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'prato-solidario-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (codes) {
    return (
      <main className="mx-auto max-w-md space-y-4 p-6">
        <h1 className="text-2xl font-bold">Guarde seus backup codes</h1>
        <p>Estes codigos aparecem UMA unica vez. Guarde em local seguro — sao sua unica forma de entrar se voce perder o dispositivo.</p>
        <ul className="rounded border bg-muted p-3 font-mono text-sm">
          {codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <button type="button" onClick={downloadCodes} className="rounded border px-3 py-2">
          Baixar .txt
        </button>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={acknowledgedCodes}
            onChange={(e) => setAcknowledgedCodes(e.target.checked)}
          />
          <span>Guardei meus codigos em local seguro</span>
        </label>
        <button
          type="button"
          disabled={!acknowledgedCodes}
          onClick={finish}
          className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          Concluir
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">Configurar 2FA</h1>
      <p>Escaneie o QR com Google Authenticator, Authy ou 1Password. Depois informe o codigo de 6 digitos.</p>
      {qrDataUrl ? (
        <img src={qrDataUrl} alt="QR code para 2FA" width={220} height={220} className="rounded border" />
      ) : otpauth ? (
        <code className="block break-all rounded border bg-muted p-2 text-xs">{otpauth}</code>
      ) : (
        <p>Gerando QR...</p>
      )}
      <label className="block">
        <span className="text-sm font-medium">Codigo do app</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={totp}
          onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
          className="mt-1 w-full rounded border px-3 py-2"
          autoComplete="one-time-code"
        />
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={pending || totp.length !== 6}
        className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
      >
        {pending ? 'Validando...' : 'Confirmar'}
      </button>
    </main>
  )
}
