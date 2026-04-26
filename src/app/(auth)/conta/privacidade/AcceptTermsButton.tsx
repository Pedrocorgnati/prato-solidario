'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { acceptNewTermsAction } from './actions'

export function AcceptTermsButton() {
  const [pending, setPending] = React.useState(false)

  async function handleClick() {
    setPending(true)
    const result = await acceptNewTermsAction()
    setPending(false)
    if (result.success) {
      toast.success('Termos aceitos com sucesso')
    } else {
      toast.error(result.error ?? 'Erro ao aceitar termos')
    }
  }

  return (
    <Button onClick={handleClick} disabled={pending} variant="default">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
      Aceitar nova versão
    </Button>
  )
}
