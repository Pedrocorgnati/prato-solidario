"use client"

/**
 * CodigoItem — Exibe um código de retirada com ações de confirmar e reportar.
 * @see module-10-codigos-historico/TASK-5/ST002
 */

import * as React from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatDateTimeBr } from "@/utils/date"
import { confirmCode, reportCode } from "@/actions/codes"
import type { RetrievalCodeWithDonation } from "@/repositories/retrieval.repository"

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE") {
    return (
      <span className="rounded-full px-3 py-1 text-xs font-semibold bg-[var(--color-success)]/10 text-[var(--color-success)]">
        Ativo
      </span>
    )
  }
  if (status === "CONFIRMED") {
    return (
      <span className="rounded-full px-3 py-1 text-xs font-semibold bg-[var(--color-info)]/10 text-[var(--color-info)]">
        Confirmado
      </span>
    )
  }
  return (
    <span className="rounded-full px-3 py-1 text-xs font-semibold bg-[var(--color-muted-raw)] text-[var(--color-text-muted)]">
      Expirado
    </span>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CodigoItemProps {
  item: RetrievalCodeWithDonation
}

// ---------------------------------------------------------------------------
// CodigoItem
// ---------------------------------------------------------------------------

export function CodigoItem({ item }: CodigoItemProps) {
  const [confirmLoading, setConfirmLoading] = React.useState(false)
  const [reportLoading, setReportLoading] = React.useState(false)
  const [reportOpen, setReportOpen] = React.useState(false)
  const [reportDescription, setReportDescription] = React.useState("")
  const [confirmed, setConfirmed] = React.useState(item.status === "CONFIRMED")
  const [dismissed, setDismissed] = React.useState(false)

  // Receptor exibido de forma anônima
  const receptorLabel = item.receptorId
    ? `Receptor #${item.receptorId.slice(-4).toUpperCase()}`
    : "Receptor anônimo"

  const handleConfirm = async () => {
    setConfirmLoading(true)
    try {
      const result = await confirmCode(item.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        setConfirmed(true)
        toast.success("Retirada confirmada com sucesso!")
      }
    } catch {
      toast.error("Erro inesperado. Tente novamente.")
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleReport = async () => {
    if (reportDescription.trim().length < 10) {
      toast.error("Descreva o problema com ao menos 10 caracteres.")
      return
    }
    setReportLoading(true)
    try {
      const result = await reportCode(item.id, reportDescription)
      if (result.error) {
        toast.error(result.error)
      } else {
        setReportOpen(false)
        setReportDescription("")
        setDismissed(true)
        toast.success("Problema reportado. Obrigado!")
      }
    } catch {
      toast.error("Erro inesperado. Tente novamente.")
    } finally {
      setReportLoading(false)
    }
  }

  if (dismissed) return null

  const isActive = item.status === "ACTIVE" && !confirmed
  const displayStatus = confirmed ? "CONFIRMED" : item.status

  return (
    <>
      <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {/* Info principal */}
          <div className="space-y-1">
            <p className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">
              {item.code}
            </p>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {item.donation.description || "Doação"}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">{receptorLabel}</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {item.portions} {item.portions === 1 ? "porção" : "porções"} · Expira em{" "}
              {formatDateTimeBr(item.expiresAt)}
            </p>
          </div>

          {/* Status + Ações */}
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <StatusBadge status={displayStatus} />
            {isActive && (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConfirm}
                  disabled={confirmLoading || reportLoading}
                >
                  {confirmLoading ? "Confirmando..." : "Confirmar retirada"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReportOpen(true)}
                  disabled={confirmLoading || reportLoading}
                >
                  Reportar problema
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de report */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reportar problema</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label
              htmlFor="report-description"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              Descreva o problema
            </label>
            <textarea
              id="report-description"
              rows={4}
              className="w-full rounded-md border border-[var(--color-border-raw)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
              placeholder="Ex: receptor não compareceu, código digitado errado..."
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              disabled={reportLoading}
            />
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Mínimo 10 caracteres.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="md"
              onClick={() => setReportOpen(false)}
              disabled={reportLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              size="md"
              onClick={handleReport}
              disabled={reportLoading}
            >
              {reportLoading ? "Enviando..." : "Enviar report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
