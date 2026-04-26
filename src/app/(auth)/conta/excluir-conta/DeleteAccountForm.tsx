'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteAccountAction } from './actions'

const CONFIRM_WORD = 'EXCLUIR'

interface DeleteAccountFormProps {
  hasActiveDonations: boolean
}

export function DeleteAccountForm({ hasActiveDonations }: DeleteAccountFormProps) {
  const router = useRouter()
  const [confirmText, setConfirmText] = React.useState('')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const isEnabled = confirmText === CONFIRM_WORD && !hasActiveDonations

  async function handleConfirm() {
    setIsLoading(true)
    const result = await deleteAccountAction()
    setIsLoading(false)

    if (result.success) {
      router.push('/conta-excluida')
    } else {
      setDialogOpen(false)
      if (result.errorCode === 'USER_083') {
        toast.error(result.error ?? 'Você tem doações ativas.', {
          description: 'Gerencie suas doações antes de excluir a conta.',
        })
      } else {
        toast.error(result.error ?? 'Erro ao excluir conta.')
      }
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Aviso de doações ativas */}
      {hasActiveDonations && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <p className="font-semibold">Você tem doações ativas.</p>
          <p>
            Aguarde a conclusão ou cancele as doações antes de excluir a conta.{' '}
            <Link href="/doador" className="underline font-medium">
              Gerenciar doações
            </Link>
          </p>
        </div>
      )}

      {/* Aviso de consequências */}
      <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-1">
        <p className="font-medium">⚠️ Esta ação é permanente.</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Seu acesso será bloqueado imediatamente.</li>
          <li>Seus dados pessoais serão removidos em até 30 dias.</li>
          <li>Seu histórico de doações será preservado de forma anônima para relatórios de impacto.</li>
        </ul>
      </div>

      {/* Input de confirmação */}
      <div className="space-y-1">
        <Label htmlFor="confirm-input">
          Para confirmar, digite <strong>{CONFIRM_WORD}</strong>
        </Label>
        <Input
          id="confirm-input"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={CONFIRM_WORD}
          className="max-w-xs"
          aria-describedby="confirm-hint"
        />
        <p id="confirm-hint" className="text-xs text-muted-foreground">
          Digite exatamente &quot;{CONFIRM_WORD}&quot; (com maiúsculas) para habilitar o botão.
        </p>
      </div>

      <Button
        variant="destructive"
        disabled={!isEnabled}
        aria-disabled={!isEnabled}
        onClick={() => setDialogOpen(true)}
      >
        Excluir minha conta permanentemente
      </Button>

      <ConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Tem certeza?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Sim, excluir minha conta"
        cancelLabel="Cancelar"
        variant="destructive"
        isLoading={isLoading}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
