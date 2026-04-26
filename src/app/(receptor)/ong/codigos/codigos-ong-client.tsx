"use client"

/**
 * CodigosOngClient — Painel interativo de códigos ativos para ONG.
 * Suporta seleção múltipla, baixa em lote e registro de ausência de doador.
 * @see module-10-codigos-historico/TASK-6/ST003
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckSquare, Square, Tag, AlertTriangle } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { BaixaEmLote } from "./components/BaixaEmLote"
import { formatDateTimeBr } from "@/utils/date"
import type { RetrievalCodeWithDonation } from "@/repositories/retrieval.repository"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[var(--color-success)]/10 text-[var(--color-success)]">
        Ativo
      </span>
    )
  }
  if (status === "CONFIRMED") {
    return (
      <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[var(--color-info)]/10 text-[var(--color-info)]">
        Confirmado
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[var(--color-muted-raw)] text-[var(--color-text-muted)]">
      Expirado
    </span>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CodigosOngClientProps {
  codes: RetrievalCodeWithDonation[]
}

// ---------------------------------------------------------------------------
// CodigosOngClient
// ---------------------------------------------------------------------------

export function CodigosOngClient({ codes }: CodigosOngClientProps) {
  const router = useRouter()

  // Seleção múltipla
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  // Estado de baixa em lote (todos)
  const [confirmAllOpen, setConfirmAllOpen] = React.useState(false)
  const [confirmAllLoading, setConfirmAllLoading] = React.useState(false)

  // Estado de confirmação de selecionados
  const [confirmSelectedLoading, setConfirmSelectedLoading] = React.useState(false)

  // Estado de ausência de doador (individual)
  const [noShowTarget, setNoShowTarget] = React.useState<string | null>(null)
  const [noShowLoading, setNoShowLoading] = React.useState(false)

  // Estado de confirmação individual
  const [confirmTarget, setConfirmTarget] = React.useState<string | null>(null)
  const [confirmIndividualLoading, setConfirmIndividualLoading] = React.useState(false)

  // Códigos localmente optimistas (confirmados no cliente)
  const [locallyConfirmed, setLocallyConfirmed] = React.useState<Set<string>>(new Set())

  // ---------------------------------------------------------------------------
  // Helpers de seleção
  // ---------------------------------------------------------------------------

  const activeCodes = codes.filter(
    (c) => c.status === "ACTIVE" && !locallyConfirmed.has(c.id)
  )

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === activeCodes.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(activeCodes.map((c) => c.id)))
    }
  }

  const isAllSelected = activeCodes.length > 0 && selected.size === activeCodes.length

  // ---------------------------------------------------------------------------
  // Confirmar selecionados
  // ---------------------------------------------------------------------------

  const handleConfirmSelected = async () => {
    if (selected.size === 0) return
    setConfirmSelectedLoading(true)
    const ids = Array.from(selected)
    let successCount = 0
    let errorCount = 0

    await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(`/api/v1/codes/${id}/confirm`, { method: "POST" })
          if (res.ok) {
            successCount++
            setLocallyConfirmed((prev) => new Set([...prev, id]))
          } else {
            errorCount++
          }
        } catch {
          errorCount++
        }
      })
    )

    setSelected(new Set())
    setConfirmSelectedLoading(false)

    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? "1 código confirmado com sucesso."
          : `${successCount} códigos confirmados com sucesso.`
      )
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} código(s) não puderam ser confirmados. Tente novamente.`)
    }

    router.refresh()
  }

  // ---------------------------------------------------------------------------
  // Confirmar individual
  // ---------------------------------------------------------------------------

  const handleConfirmIndividual = async (id: string) => {
    setConfirmTarget(null)
    setConfirmIndividualLoading(true)
    try {
      const res = await fetch(`/api/v1/codes/${id}/confirm`, { method: "POST" })
      const body = await res.json().catch(() => ({}))
      if (res.ok) {
        setLocallyConfirmed((prev) => new Set([...prev, id]))
        toast.success("Retirada confirmada com sucesso!")
        router.refresh()
      } else {
        toast.error(body.message ?? "Erro ao confirmar código. Tente novamente.")
      }
    } catch {
      toast.error("Erro inesperado. Tente novamente.")
    } finally {
      setConfirmIndividualLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Confirmar todos (baixa em lote)
  // ---------------------------------------------------------------------------

  const handleConfirmAll = async () => {
    setConfirmAllLoading(true)
    try {
      const res = await fetch("/api/v1/codes/confirm-all", { method: "POST" })
      const body = await res.json().catch(() => ({}))
      if (res.ok) {
        const count: number = body.confirmed ?? 0
        setLocallyConfirmed(new Set(codes.map((c) => c.id)))
        setSelected(new Set())
        toast.success(
          count === 0
            ? "Nenhum código ativo para confirmar."
            : `${count} código(s) confirmado(s) em lote com sucesso!`
        )
        router.refresh()
      } else {
        toast.error(body.message ?? "Erro ao confirmar todos os códigos. Tente novamente.")
      }
    } catch {
      toast.error("Erro inesperado. Tente novamente.")
    } finally {
      setConfirmAllLoading(false)
      setConfirmAllOpen(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Ausência de doador (no-show)
  // ---------------------------------------------------------------------------

  const handleNoShow = async (id: string) => {
    setNoShowTarget(null)
    setNoShowLoading(true)
    try {
      const res = await fetch(`/api/v1/codes/${id}/no-show`, { method: "POST" })
      const body = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success("Ausência registrada. Código permanece ativo por mais 30 minutos.")
        router.refresh()
      } else {
        toast.error(body.message ?? "Erro ao registrar ausência. Tente novamente.")
      }
    } catch {
      toast.error("Erro inesperado. Tente novamente.")
    } finally {
      setNoShowLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Empty state
  // ---------------------------------------------------------------------------

  if (codes.length === 0) {
    return (
      <EmptyState
        icon={<Tag className="h-8 w-8" />}
        title="Nenhum código ativo"
        description="Não há códigos de retirada ativos no momento para sua ONG."
      />
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const visibleActive = activeCodes

  return (
    <>
      {/* Barra de ações em lote */}
      <div className="flex flex-wrap items-center gap-3">
        {selected.size > 0 && (
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            {selected.size} {selected.size === 1 ? "selecionado" : "selecionados"}
          </span>
        )}
        {selected.size > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={handleConfirmSelected}
            disabled={confirmSelectedLoading || confirmIndividualLoading}
          >
            {confirmSelectedLoading ? "Confirmando..." : "Confirmar selecionados"}
          </Button>
        )}
        <div className="ml-auto">
          <BaixaEmLote
            disabled={activeCodes.length === 0 || confirmAllLoading}
            onConfirmAll={handleConfirmAll}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="w-full overflow-x-auto rounded-lg border border-[var(--color-border-raw)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface)]">
            <tr>
              {/* Checkbox selecionar todos */}
              <th scope="col" className="px-4 py-3 w-10">
                <button
                  type="button"
                  aria-label={isAllSelected ? "Desmarcar todos" : "Selecionar todos"}
                  onClick={toggleAll}
                  disabled={visibleActive.length === 0}
                  className="flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-40"
                >
                  {isAllSelected ? (
                    <CheckSquare className="h-4 w-4 text-[var(--color-primary-raw)]" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
                Código
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
                Beneficiário
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
                Qtd
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
                Validade
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold text-[var(--color-text-primary)] whitespace-nowrap">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-[var(--color-text-muted)]"
                >
                  Nenhum código encontrado.
                </td>
              </tr>
            ) : (
              codes.map((code) => {
                const isActive = code.status === "ACTIVE" && !locallyConfirmed.has(code.id)
                const displayStatus = locallyConfirmed.has(code.id) ? "CONFIRMED" : code.status
                const isSelected = selected.has(code.id)
                const receptorLabel = code.receptorId
                  ? `Beneficiário #${code.receptorId.slice(-4).toUpperCase()}`
                  : "Anônimo"

                return (
                  <tr
                    key={code.id}
                    className={`border-t border-[var(--color-border-raw)] transition-colors ${
                      isSelected
                        ? "bg-[var(--color-primary-raw)]/5"
                        : "hover:bg-[var(--color-surface)]"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3 w-10">
                      {isActive ? (
                        <button
                          type="button"
                          aria-label={isSelected ? "Desmarcar código" : "Selecionar código"}
                          onClick={() => toggleSelect(code.id)}
                          className="flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-[var(--color-primary-raw)]" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <span className="h-4 w-4 block" />
                      )}
                    </td>

                    {/* Código */}
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-[var(--color-text-primary)]">
                        {code.code}
                      </span>
                    </td>

                    {/* Beneficiário (anônimo) */}
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {receptorLabel}
                    </td>

                    {/* Qtd */}
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {code.portions}
                    </td>

                    {/* Validade */}
                    <td className="px-4 py-3 text-[var(--color-text-secondary)] whitespace-nowrap">
                      {formatDateTimeBr(code.expiresAt)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={displayStatus} />
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3">
                      {isActive ? (
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setConfirmTarget(code.id)}
                            disabled={confirmIndividualLoading || confirmSelectedLoading}
                          >
                            Confirmar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNoShowTarget(code.id)}
                            disabled={noShowLoading}
                          >
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                            Doador ausente
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog — Confirmar individual */}
      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null)
        }}
        title="Confirmar retirada"
        description="Confirma que este beneficiário recebeu os alimentos? Esta ação é irreversível."
        confirmLabel="Confirmar retirada"
        cancelLabel="Cancelar"
        onConfirm={() => {
          if (confirmTarget) handleConfirmIndividual(confirmTarget)
        }}
        isLoading={confirmIndividualLoading}
      />

      {/* Dialog — Confirmar todos (baixa em lote) */}
      <ConfirmDialog
        open={confirmAllOpen}
        onOpenChange={(open) => {
          if (!open && !confirmAllLoading) setConfirmAllOpen(false)
        }}
        title="Confirmar todos os códigos"
        description="Ao confirmar, você declara que todos os beneficiários receberam os alimentos. Esta ação é irreversível e será registrada."
        confirmLabel="Confirmar todos"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmAll}
        isLoading={confirmAllLoading}
      />

      {/* Dialog — Doador ausente */}
      <ConfirmDialog
        open={noShowTarget !== null}
        onOpenChange={(open) => {
          if (!open) setNoShowTarget(null)
        }}
        title="Registrar ausência do doador"
        description="Registrar ausência do doador? O código ficará ativo por mais 30 minutos. Após esse período, será cancelado automaticamente."
        confirmLabel="Registrar ausência"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={() => {
          if (noShowTarget) handleNoShow(noShowTarget)
        }}
        isLoading={noShowLoading}
      />
    </>
  )
}
