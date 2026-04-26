'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CepInput } from '@/components/shared/cep-input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Address } from '@prisma/client'
import { addAddressAction, updateAddressAction, deleteAddressAction } from './actions'

const addressSchema = z.object({
  cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos'),
  logradouro: z.string().min(1, 'Logradouro obrigatório'),
  numero: z.string().min(1, 'Número obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro obrigatório'),
  cidade: z.string().min(1, 'Cidade obrigatória'),
  estado: z.string().length(2, 'Estado obrigatório (2 letras)'),
})

type AddressForm = z.infer<typeof addressSchema>

const MAX_ADDRESSES = 5

interface AddressManagerProps {
  initialAddresses: Address[]
}

export function AddressManager({ initialAddresses }: AddressManagerProps) {
  const router = useRouter()
  const [addresses, setAddresses] = React.useState<Address[]>(initialAddresses)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const atLimit = addresses.length >= MAX_ADDRESSES

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressForm>({ resolver: zodResolver(addressSchema) })

  function openAdd() {
    setEditingId(null)
    reset({})
    setSheetOpen(true)
  }

  function openEdit(address: Address) {
    setEditingId(address.id)
    reset({
      cep: address.cep,
      logradouro: address.logradouro,
      numero: address.numero,
      complemento: address.complemento ?? '',
      bairro: address.bairro,
      cidade: address.cidade,
      estado: address.estado,
    })
    setSheetOpen(true)
  }

  async function onSubmit(data: AddressForm) {
    let result
    if (editingId) {
      result = await updateAddressAction(editingId, data)
    } else {
      result = await addAddressAction(data)
    }

    if (result.success) {
      toast.success(editingId ? 'Endereço atualizado' : 'Endereço salvo')
      setSheetOpen(false)
      router.refresh()
    } else {
      toast.error(result.error ?? 'Erro ao salvar endereço')
    }
  }

  function requestDelete(id: string) {
    setDeletingId(id)
    setConfirmOpen(true)
  }

  async function confirmDelete() {
    if (!deletingId) return
    setIsDeleting(true)
    const result = await deleteAddressAction(deletingId)
    setIsDeleting(false)
    setConfirmOpen(false)
    if (result.success) {
      setAddresses((prev) => prev.filter((a) => a.id !== deletingId))
      toast.success('Endereço removido')
    } else {
      toast.error(result.error ?? 'Erro ao remover endereço')
    }
  }

  return (
    <>
      {/* Lista */}
      {addresses.length === 0 ? (
        <EmptyState
          title="Nenhum endereço salvo"
          description="Você ainda não tem endereços salvos. Adicione um para facilitar suas doações!"
          action={{ label: '+ Adicionar endereço', onClick: openAdd }}
        />
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="flex items-start justify-between rounded-lg border p-4"
            >
              <div className="text-sm">
                <p className="font-medium">
                  {address.logradouro}, {address.numero}
                  {address.complemento ? `, ${address.complemento}` : ''}
                </p>
                <p className="text-muted-foreground">
                  {address.bairro} — {address.cidade}/{address.estado}
                </p>
                <p className="text-xs text-muted-foreground">CEP: {address.cep}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => openEdit(address)}
                  aria-label="Editar endereço"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => requestDelete(address.id)}
                  aria-label="Excluir endereço"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            onClick={openAdd}
            disabled={atLimit}
            variant="outline"
            title={atLimit ? 'Limite de 5 endereços atingido' : undefined}
            aria-disabled={atLimit}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar endereço
          </Button>
        </div>
      )}

      {/* Sheet de formulário */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto sm:max-w-lg sm:mx-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? 'Editar endereço' : 'Novo endereço'}</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <CepInput
                label="CEP"
                required
                onAddressFill={(data) => {
                  setValue('logradouro', data.logradouro)
                  setValue('bairro', data.bairro)
                  setValue('cidade', data.localidade)
                  setValue('estado', data.uf)
                }}
                error={errors.cep?.message}
                onChange={(v) => setValue('cep', v.replace(/\D/g, ''))}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input id="logradouro" {...register('logradouro')} />
                {errors.logradouro && (
                  <p className="text-xs text-destructive">{errors.logradouro.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" {...register('numero')} />
                {errors.numero && (
                  <p className="text-xs text-destructive">{errors.numero.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="complemento">Complemento (opcional)</Label>
              <Input id="complemento" {...register('complemento')} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="bairro">Bairro</Label>
              <Input id="bairro" {...register('bairro')} />
              {errors.bairro && (
                <p className="text-xs text-destructive">{errors.bairro.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" {...register('cidade')} />
                {errors.cidade && (
                  <p className="text-xs text-destructive">{errors.cidade.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="estado">UF</Label>
                <Input id="estado" {...register('estado')} maxLength={2} className="uppercase" />
                {errors.estado && (
                  <p className="text-xs text-destructive">{errors.estado.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Atualizar' : 'Salvar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Confirm dialog de exclusão */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remover endereço"
        description="Deseja remover este endereço?"
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
      />
    </>
  )
}
