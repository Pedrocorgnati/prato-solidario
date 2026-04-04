"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CodeStatus } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface WithdrawalCodeDisplayProps {
  code: string
  status: CodeStatus
  address?: string
  windowStart?: string
  windowEnd?: string
  className?: string
}

const statusConfig: Record<CodeStatus, { label: string; color: string }> = {
  [CodeStatus.ATIVO]: { label: "Ativo", color: "bg-[var(--color-success)] text-white" },
  [CodeStatus.CONFIRMADO]: { label: "Confirmado", color: "bg-[var(--color-info)] text-white" },
  [CodeStatus.EXPIRADO]: { label: "Expirado", color: "bg-[var(--color-text-muted)] text-white" },
  [CodeStatus.CANCELADO]: { label: "Cancelado", color: "bg-[var(--color-danger)] text-white" },
}

export function WithdrawalCodeDisplay({
  code,
  status,
  address,
  windowStart,
  windowEnd,
  className,
}: WithdrawalCodeDisplayProps) {
  const [copied, setCopied] = React.useState(false)
  const config = statusConfig[status]

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success("Código copiado!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Não foi possível copiar")
    }
  }

  return (
    <div data-testid="withdrawal-code-display" className={cn("flex flex-col items-center gap-6 p-6", className)}>
      <div
        className={cn(
          "flex h-24 w-24 items-center justify-center rounded-full",
          status === CodeStatus.ATIVO && "bg-[var(--color-success)]/10",
          status === CodeStatus.CONFIRMADO && "bg-[var(--color-info)]/10",
          (status === CodeStatus.EXPIRADO || status === CodeStatus.CANCELADO) &&
            "bg-[var(--color-muted-raw)]"
        )}
      >
        <span
          className={cn(
            "font-bold",
            "text-[clamp(2.5rem,8vw,4rem)]",
            "tracking-widest font-mono leading-none",
            status === CodeStatus.ATIVO && "text-[var(--color-success)]",
            status === CodeStatus.CONFIRMADO && "text-[var(--color-info)]",
            (status === CodeStatus.EXPIRADO || status === CodeStatus.CANCELADO) &&
              "text-[var(--color-text-muted)]"
          )}
          aria-label={`Código de retirada: ${code.split("").join(" ")}`}
        >
          {code}
        </span>
      </div>

      <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", config.color)}>
        {config.label}
      </span>

      {status === CodeStatus.ATIVO && (
        <Button data-testid="withdrawal-code-copy-button" variant="outline" size="md" onClick={handleCopy} className="gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado!" : "Copiar código"}
        </Button>
      )}

      {address && (
        <div className="text-center space-y-1">
          <p className="text-xs text-[var(--color-text-muted)]">Local de retirada</p>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">{address}</p>
        </div>
      )}

      {windowStart && windowEnd && (
        <div className="text-center space-y-1">
          <p className="text-xs text-[var(--color-text-muted)]">Janela de retirada</p>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            {windowStart} — {windowEnd}
          </p>
        </div>
      )}
    </div>
  )
}
