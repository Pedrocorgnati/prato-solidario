'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { requestDataExportAction } from './actions'

interface ExportRequestButtonProps {
  hasPending: boolean
}

export function ExportRequestButton({ hasPending }: ExportRequestButtonProps) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  async function handleClick() {
    setPending(true)
    const result = await requestDataExportAction()
    setPending(false)
    if (result.success) {
      toast.success('Exportação solicitada. Disponível em até 72h.')
      router.refresh()
    } else {
      toast.error(result.error ?? 'Erro ao solicitar exportação')
    }
  }

  const isDisabled = hasPending || pending

  return (
    <Button
      onClick={handleClick}
      disabled={isDisabled}
      title={hasPending ? 'Você já tem uma solicitação em andamento' : undefined}
      aria-disabled={isDisabled}
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Solicitar exportação
    </Button>
  )
}
