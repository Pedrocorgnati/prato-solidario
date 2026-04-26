"use client"

/**
 * MpStatusBanner — Banner persistente que avisa a marmitaria quando o token
 * Mercado Pago está expirado/desconectado e oferece CTA para reconectar.
 * @see intake-review TASK-6/ST002 (CL-279)
 *
 * Ressalva: SWR não é dependência deste projeto; usamos fetch + polling leve.
 */

import * as React from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { ROUTES } from "@/lib/constants"

interface MpStatus {
  connected: boolean
  expired: boolean
  accountName: string | null
  expiresAt: string | null
}

export function MpStatusBanner() {
  const [status, setStatus] = React.useState<MpStatus | null>(null)
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/v1/marmitarias/mp-status", {
          cache: "no-store",
        })
        if (!res.ok) return
        const json = (await res.json()) as MpStatus
        if (!cancelled) setStatus(json)
      } catch {
        // silencioso — banner não aparece se endpoint falhar
      } finally {
        if (!cancelled) setLoaded(true)
      }
    }
    load()
    const interval = setInterval(load, 5 * 60 * 1000) // 5min
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (!loaded || !status) return null

  const needsAction = status.expired || !status.connected
  if (!needsAction) return null

  const copy = status.expired
    ? "Sua conexão com o Mercado Pago expirou. Reconecte para voltar a receber patrocínios."
    : "Sua conta Mercado Pago não está conectada. Conecte para começar a receber patrocínios."

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <p>{copy}</p>
      </div>
      <Link
        href={ROUTES.MARMITARIA_MP_CONNECT}
        className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        Reconectar Mercado Pago
      </Link>
    </div>
  )
}
