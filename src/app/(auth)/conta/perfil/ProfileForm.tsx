'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhotoUpload } from '@/components/shared/photo-upload'
import { PhoneInput } from '@/components/shared/phone-input'
import { updateProfileAction } from './actions'
import type { ProfileWithRestaurant } from '@/services/profile.service'

const AREA_ATUACAO_OPTIONS = [
  'Alimentação',
  'Educação',
  'Saúde',
  'Assistência Social',
  'Outro',
] as const

const schema = z.object({
  name: z.string().min(2, 'Nome completo é obrigatório').max(255),
  phone: z
    .string()
    .regex(/^\+55\d{10,11}$/, 'Telefone inválido')
    .optional()
    .or(z.literal('')),
  photoUrl: z.string().optional(),
  tradeName: z.string().min(2, 'Nome do restaurante é obrigatório').max(255).optional(),
  areaAtuacao: z.string().max(100).optional(),
  descricao: z.string().max(500).optional(),
  companyName: z.string().max(255).optional(),
  companyDescription: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof schema>

interface ProfileFormProps {
  user: ProfileWithRestaurant
  onSuccess?: () => void
}

export function ProfileForm({ user, onSuccess }: ProfileFormProps) {
  const isRestaurant = user.role === 'DOADOR_RESTAURANTE'
  const isOng = user.role === 'ONG'
  const isSponsor = user.role === 'SPONSOR' || user.role === 'PATROCINADOR'
  const sponsorCnpjLocked = Boolean(user.sponsorProfile?.cnpj)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name ?? '',
      phone: user.phone ?? '',
      photoUrl: user.photoUrl ?? '',
      tradeName: user.restaurantProfile?.tradeName ?? '',
      areaAtuacao: user.ongProfile?.areaAtuacao ?? '',
      descricao: user.ongProfile?.descricao ?? '',
      companyName: user.sponsorProfile?.companyName ?? '',
      companyDescription: user.sponsorProfile?.companyDescription ?? '',
    },
  })

  const photoUrl = watch('photoUrl')

  async function onSubmit(values: FormValues) {
    const result = await updateProfileAction(values)
    if (result.success) {
      toast.success('Perfil atualizado com sucesso')
      onSuccess?.()
    } else {
      toast.error(result.error ?? 'Erro ao atualizar perfil')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 max-w-lg">
      {/* Foto de perfil */}
      <div className="space-y-2">
        <PhotoUpload
          value={photoUrl}
          onChange={(url) => setValue('photoUrl', url)}
          label="Foto de perfil"
          accept="image/jpeg,image/png"
          maxSizeMb={5}
        />
      </div>

      {/* Nome completo */}
      <div className="space-y-1">
        <Label htmlFor="name">Nome completo</Label>
        <Input
          id="name"
          {...register('name')}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-destructive" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Telefone */}
      <div className="space-y-1">
        <PhoneInput
          value={watch('phone') ?? ''}
          onChange={(v) => setValue('phone', v)}
          error={errors.phone?.message}
          label="Telefone (opcional)"
          name="phone"
        />
      </div>

      {/* Nome do restaurante — apenas DOADOR_RESTAURANTE */}
      {isRestaurant && (
        <div className="space-y-1">
          <Label htmlFor="tradeName">Nome do restaurante</Label>
          <Input
            id="tradeName"
            {...register('tradeName')}
            aria-describedby={errors.tradeName ? 'tradeName-error' : undefined}
          />
          {errors.tradeName && (
            <p id="tradeName-error" className="text-sm text-destructive" role="alert">
              {errors.tradeName.message}
            </p>
          )}
        </div>
      )}

      {/* Dados da ONG — apenas role ONG */}
      {isOng && (
        <fieldset className="space-y-4 border border-[var(--color-border-raw)] rounded-lg p-4">
          <legend className="text-sm font-semibold text-[var(--color-text-primary)] px-1">Dados da ONG</legend>

          <div className="space-y-1">
            <Label htmlFor="razaoSocial">Razão Social</Label>
            <Input
              id="razaoSocial"
              value={user.name ?? ''}
              disabled
              aria-label="Razão social (informacional)"
            />
            <p className="text-xs text-[var(--color-text-muted)]">Definida no cadastro — entre em contato para alterar.</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="areaAtuacao">Área de Atuação</Label>
            <select
              id="areaAtuacao"
              {...register('areaAtuacao')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecione...</option>
              {AREA_ATUACAO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="descricao">Descrição da ONG</Label>
            <textarea
              id="descricao"
              {...register('descricao')}
              maxLength={500}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Conte um pouco sobre a missão da ONG..."
            />
            <p className="text-xs text-[var(--color-text-muted)]">{(watch('descricao') ?? '').length}/500</p>
          </div>
        </fieldset>
      )}

      {/* Dados da Empresa — apenas role SPONSOR/PATROCINADOR */}
      {isSponsor && (
        <fieldset className="space-y-4 border border-[var(--color-border-raw)] rounded-lg p-4">
          <legend className="text-sm font-semibold text-[var(--color-text-primary)] px-1">Dados da Empresa</legend>

          <div className="space-y-1">
            <Label htmlFor="companyName">Nome da Empresa</Label>
            <Input
              id="companyName"
              {...register('companyName')}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cnpjSponsor">CNPJ</Label>
            <Input
              id="cnpjSponsor"
              value={user.sponsorProfile?.cnpj ?? ''}
              disabled={sponsorCnpjLocked}
              placeholder="00.000.000/0000-00"
              aria-label="CNPJ da empresa"
            />
            {sponsorCnpjLocked && (
              <p className="text-xs text-[var(--color-text-muted)]">CNPJ definido no cadastro — não pode ser alterado.</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="companyDescription">Descrição da Empresa</Label>
            <textarea
              id="companyDescription"
              {...register('companyDescription')}
              maxLength={500}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Descreva a empresa e sua motivação para apoiar..."
            />
            <p className="text-xs text-[var(--color-text-muted)]">{(watch('companyDescription') ?? '').length}/500</p>
          </div>
        </fieldset>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Salvando...
          </>
        ) : (
          'Salvar alterações'
        )}
      </Button>
    </form>
  )
}
