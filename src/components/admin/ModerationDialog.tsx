'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ModerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: (motivo: string) => void | Promise<void>
  variant?: 'default' | 'destructive'
  isLoading?: boolean
  /** Mínimo de caracteres para o motivo. 0 = motivo opcional */
  minMotivo?: number
  motivoLabel?: string
  motivoPlaceholder?: string
}

export function ModerationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  variant = 'default',
  isLoading = false,
  minMotivo = 10,
  motivoLabel = 'Motivo',
  motivoPlaceholder = 'Informe o motivo da ação...',
}: ModerationDialogProps) {
  const [motivo, setMotivo] = React.useState('')
  const cancelRef = React.useRef<HTMLButtonElement>(null)

  const isValid = minMotivo === 0 || motivo.trim().length >= minMotivo

  React.useEffect(() => {
    if (open) {
      setMotivo('')
      setTimeout(() => cancelRef.current?.focus(), 50)
    }
  }, [open])

  async function handleConfirm() {
    if (!isValid && minMotivo > 0) return
    await onConfirm(motivo.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-2 py-2">
          <label className="text-sm font-medium text-[var(--color-text-primary)]">
            {motivoLabel}{minMotivo > 0 && ' *'}
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={motivoPlaceholder}
            rows={3}
            maxLength={1000}
            className="w-full rounded-md border border-[var(--color-border-raw)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            disabled={isLoading}
          />
          {minMotivo > 0 && motivo.length > 0 && motivo.trim().length < minMotivo && (
            <p className="text-xs text-[var(--color-error)]">
              Mínimo de {minMotivo} caracteres ({motivo.trim().length}/{minMotivo})
            </p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            ref={cancelRef}
            variant="outline"
            size="md"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            size="md"
            onClick={handleConfirm}
            disabled={isLoading || (minMotivo > 0 && !isValid)}
          >
            {isLoading ? 'Aguarde...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
