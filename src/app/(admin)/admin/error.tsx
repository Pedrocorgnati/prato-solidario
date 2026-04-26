'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <AlertTriangle className="h-12 w-12 text-[var(--color-error)]" />
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
        Erro no painel admin
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] max-w-md text-center">
        Ocorreu um erro ao carregar esta página. Tente novamente ou entre em contato com o suporte.
      </p>
      {error.digest && (
        <p className="text-xs text-[var(--color-text-muted)] font-mono">
          Código: {error.digest}
        </p>
      )}
      <Button variant="default" size="md" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  )
}
