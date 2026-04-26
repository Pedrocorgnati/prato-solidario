"use client"

/**
 * Banner de status de bloqueio — TASK-7/ST002 (intake-review) CL-286.
 * Consulta /api/v1/users/me/block-status e exibe aviso acessivel se bloqueado.
 */
import * as React from "react"

type BlockStatus = {
  blocked: boolean
  reason?: string
  until?: string
  escalationStep?: number
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function BlockStatusBanner() {
  const [status, setStatus] = React.useState<BlockStatus | null>(null)

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/v1/users/me/block-status", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return null
        const json = (await res.json()) as { data: BlockStatus }
        return json.data
      })
      .then((data) => {
        if (!cancelled && data) setStatus(data)
      })
      .catch(() => {
        // Silencioso: falha de rede nao deve poluir o painel.
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!status || !status.blocked) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-100"
    >
      <p className="font-medium">
        Você está temporariamente impossibilitado de gerar novos códigos.
      </p>
      {status.until && (
        <p className="mt-1 text-sm">
          Desbloqueio automático em <strong>{formatDate(status.until)}</strong>.
        </p>
      )}
      {status.reason && status.reason !== "other" && (
        <p className="mt-1 text-sm text-muted-foreground">
          Motivo: {status.reason === "no_show" ? "não comparecimento" : status.reason}.
        </p>
      )}
      <a
        href="/ajuda/politica-anti-abuso"
        className="mt-2 inline-block text-sm underline underline-offset-4"
      >
        Saiba mais
      </a>
    </div>
  )
}
