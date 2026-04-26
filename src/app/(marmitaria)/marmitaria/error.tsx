'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function MarmitariaError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Algo deu errado</h1>
      <p className="text-[var(--color-text-secondary)]">
        Não foi possível carregar esta página. Tente novamente.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  )
}
