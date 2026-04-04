"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center space-y-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-danger)]/10">
        <AlertTriangle className="h-10 w-10 text-[var(--color-danger)]" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Algo deu errado
        </h2>
        <p className="text-[var(--color-text-secondary)]">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        {error.digest && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Código: {error.digest}
          </p>
        )}
      </div>
      <Button variant="default" size="lg" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  )
}
