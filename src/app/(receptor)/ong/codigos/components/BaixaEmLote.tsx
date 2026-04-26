"use client"

/**
 * BaixaEmLote — Botão de confirmação em lote para a ONG.
 * Abre ConfirmDialog com aviso de responsabilidade antes de chamar confirm-all.
 * @see module-10-codigos-historico/TASK-6/ST004
 */

import * as React from "react"
import { ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BaixaEmLoteProps {
  /** Desabilita o botão (ex: nenhum código ativo ou carregamento em andamento). */
  disabled: boolean
  /** Callback chamado após confirmação — deve realizar a chamada à API e retornar. */
  onConfirmAll: () => Promise<void>
}

// ---------------------------------------------------------------------------
// BaixaEmLote
// ---------------------------------------------------------------------------

export function BaixaEmLote({ disabled, onConfirmAll }: BaixaEmLoteProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirmAll()
    } finally {
      setLoading(false)
      setDialogOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || loading}
        onClick={() => setDialogOpen(true)}
        aria-label="Confirmar todos os códigos em lote"
      >
        <ListChecks className="mr-1.5 h-4 w-4" />
        Confirmar todos os códigos
      </Button>

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!loading) setDialogOpen(open)
        }}
        title="Confirmar todos os códigos"
        description="Ao confirmar, você declara que todos os beneficiários receberam os alimentos. Esta ação é irreversível e será registrada."
        confirmLabel="Confirmar todos"
        cancelLabel="Cancelar"
        onConfirm={handleConfirm}
        isLoading={loading}
      />
    </>
  )
}
