'use client'

import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { disconnectMPAction } from '@/app/(marmitaria)/marmitaria/integracoes/mercadopago/actions'

/**
 * Client Island — botão de desconexão com dialog de confirmação.
 * Apenas este componente é "use client" na página de integração.
 *
 * TASK-4/ST004 | US-MP-003 | VISUAL-TASK-4
 */
export function DisconnectMPButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { success, error } = useToast()

  async function handleDisconnect() {
    setLoading(true)
    const result = await disconnectMPAction()
    setLoading(false)

    if (result.success) {
      setOpen(false)
      success('Mercado Pago desconectado.')
    } else {
      error('Erro ao desconectar. Tente novamente.')
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:bg-red-50 dark:hover:bg-red-950/20"
        onClick={() => setOpen(true)}
        aria-label="Desconectar Mercado Pago"
      >
        Desconectar
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Desconectar Mercado Pago?"
        description="Ao desconectar, sua marmitaria não poderá receber novos pagamentos de patrocínio. Créditos já creditados não são afetados."
        confirmLabel={loading ? 'Desconectando...' : 'Desconectar'}
        cancelLabel="Cancelar"
        onConfirm={handleDisconnect}
        variant="destructive"
        isLoading={loading}
      />
    </>
  )
}
