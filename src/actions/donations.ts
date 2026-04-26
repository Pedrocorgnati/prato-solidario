'use server'

/**
 * Server Actions para doações.
 * @see module-8-doacao-form/TASK-2/ST002 (createDoacaoAction)
 * @see module-8-doacao-form/TASK-3/ST005 (publishSobrouAction)
 * @see module-8-doacao-form/TASK-4/ST004 (cancelDonacaoAction)
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { cepSchema } from '@/validators/cep'
import { requireRole, requireSession } from '@/lib/auth/session'
import { donationService } from '@/services/donation.service'
import { notificationService } from '@/services/notification.service'
import { donationRepository } from '@/repositories/donation.repository'
import { geocodeAddress } from '@/lib/geocoding'
import { prisma } from '@/lib/prisma'
import { DonationStatus, DonationType } from '@/types/enums'
import type { ActionResponse } from '@/types/common'
import type { Donation } from '@prisma/client'

// ---------------------------------------------------------------------------
// Schemas Zod
// ---------------------------------------------------------------------------

const doacaoSchema = z
  .object({
    portions: z.number().int().min(1, 'Mínimo 1 porção').max(200, 'Máximo 200 porções'),
    windowStart: z.string().datetime({ message: 'Horário de início inválido' }),
    windowEnd: z.string().datetime({ message: 'Horário de fim inválido' }),
    cep: cepSchema,
    logradouro: z.string().min(1, 'Logradouro obrigatório'),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().min(1, 'Bairro obrigatório'),
    cidade: z.string().min(1, 'Cidade obrigatória'),
    estado: z.string().length(2, 'Estado deve ter 2 letras'),
    radiusKm: z
      .union([z.literal(1), z.literal(2), z.literal(5), z.literal(10)])
      .default(5),
    description: z.string().max(200, 'Máximo 200 caracteres').optional(),
  })
  .refine(
    (data) => {
      const diff = new Date(data.windowEnd).getTime() - new Date(data.windowStart).getTime()
      return diff >= 30 * 60 * 1000
    },
    {
      message: 'Janela de retirada deve ser de no mínimo 30 minutos.',
      path: ['windowEnd'],
    }
  )

const sobrouSchema = z.object({
  portions: z.number().int().min(1).max(200),
  locationType: z.enum(['gps', 'cep']),
  lat: z.number().optional(),
  lng: z.number().optional(),
  cep: cepSchema.optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
})

// ---------------------------------------------------------------------------
// createDoacaoAction — Criação de doação padrão
// @see module-8-doacao-form/TASK-2/ST002
// ---------------------------------------------------------------------------

export async function createDoacaoAction(
  _prevState: ActionResponse<Donation>,
  formData: FormData
): Promise<ActionResponse<Donation>> {
  const session = await requireRole(['DOADOR_PF', 'DOADOR_RESTAURANTE'])

  const rawData = {
    portions: Number(formData.get('portions')),
    windowStart: formData.get('windowStart') as string,
    windowEnd: formData.get('windowEnd') as string,
    cep: formData.get('cep') as string,
    logradouro: formData.get('logradouro') as string,
    numero: formData.get('numero') as string | undefined,
    complemento: formData.get('complemento') as string | undefined,
    bairro: formData.get('bairro') as string,
    cidade: formData.get('cidade') as string,
    estado: formData.get('estado') as string,
    radiusKm: Number(formData.get('radiusKm') ?? 5) as 1 | 2 | 5 | 10,
    description: formData.get('description') as string | undefined,
  }

  const parsed = doacaoSchema.safeParse(rawData)
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { data: null, error: firstError ?? 'Dados inválidos.', status: 400 }
  }

  try {
    const { portions, windowStart, windowEnd, radiusKm, description, ...addressFields } = parsed.data

    const donation = await donationService.createDonation(session.id, {
      portions,
      windowStart: new Date(windowStart),
      windowEnd: new Date(windowEnd),
      address: {
        cep: addressFields.cep,
        logradouro: addressFields.logradouro,
        numero: addressFields.numero,
        complemento: addressFields.complemento,
        bairro: addressFields.bairro,
        cidade: addressFields.cidade,
        estado: addressFields.estado,
      },
      radiusKm,
      type: DonationType.REGULAR,
      description,
    })

    revalidatePath('/doador')
    revalidatePath('/doador/historico')
    redirect('/doador')

    return { data: donation, error: null, status: 201 }
  } catch (err) {
    if (err instanceof Error && err.name === 'GeocodingError') {
      return {
        data: null,
        error: 'Não foi possível localizar o endereço. Verifique o CEP e tente novamente.',
        status: 503,
      }
    }
    if (err instanceof Error && err.name === 'DonationValidationError') {
      return { data: null, error: err.message, status: 400 }
    }
    console.error('[createDoacaoAction]', err)
    return {
      data: null,
      error: 'Não foi possível concluir. Verifique sua conexão e tente novamente.',
      status: 500,
    }
  }
}

// ---------------------------------------------------------------------------
// publishSobrouAction — Publicação rápida "Sobrou!" (janela 30min)
// @see module-8-doacao-form/TASK-3/ST005
// ---------------------------------------------------------------------------

export async function publishSobrouAction(
  _prevState: ActionResponse<Donation>,
  formData: FormData
): Promise<ActionResponse<Donation>> {
  const session = await requireRole(['DOADOR_PF', 'DOADOR_RESTAURANTE'])

  // Cooldown anti-abuso: bloqueia segundo "Sobrou!" do mesmo doador em janela configurável.
  // @see intake-review/TASK-9/ST002 — gap CL-289
  const cooldownHours = Number(process.env.SOBROU_COOLDOWN_HOURS ?? '2')
  if (Number.isFinite(cooldownHours) && cooldownHours > 0) {
    const since = new Date(Date.now() - cooldownHours * 60 * 60 * 1000)
    const recent = await prisma.donation.findFirst({
      where: {
        donorId: session.id,
        description: { startsWith: 'Sobrou!' },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })
    if (recent) {
      const elapsedMs = Date.now() - recent.createdAt.getTime()
      const retryAfter = Math.max(1, Math.ceil((cooldownHours * 60 * 60 * 1000 - elapsedMs) / 1000))
      return {
        data: null,
        error: `Aguarde ${cooldownHours}h entre alertas "Sobrou!". Tente novamente em alguns instantes.`,
        status: 429,
        // @ts-expect-error retryAfter é extensão contextual do ActionResponse
        retryAfter,
      }
    }
  }

  const rawData = {
    portions: Number(formData.get('portions') ?? 5),
    locationType: formData.get('locationType') as 'gps' | 'cep',
    lat: formData.get('lat') ? Number(formData.get('lat')) : undefined,
    lng: formData.get('lng') ? Number(formData.get('lng')) : undefined,
    cep: formData.get('cep') as string | undefined,
    bairro: formData.get('bairro') as string | undefined,
    cidade: formData.get('cidade') as string | undefined,
    estado: formData.get('estado') as string | undefined,
  }

  const parsed = sobrouSchema.safeParse(rawData)
  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { data: null, error: firstError ?? 'Dados inválidos.', status: 400 }
  }

  const { portions, locationType, lat, lng, cep, bairro, cidade, estado } = parsed.data

  // Calcular janela de 30 minutos
  const windowStart = new Date()
  const windowEnd = new Date(Date.now() + 30 * 60 * 1000)

  try {
    let location: { lat: number; lng: number }

    if (locationType === 'gps' && lat != null && lng != null) {
      // GPS: usar coordenadas diretamente (já geocodificado no cliente)
      location = { lat, lng }
    } else {
      // CEP: geocodificar server-side
      if (!cep) {
        return {
          data: null,
          error: 'Informe seu CEP para buscar receptores próximos.',
          status: 400,
        }
      }
      location = await geocodeAddress({
        cep,
        logradouro: '',
        bairro: bairro ?? '',
        cidade: cidade ?? '',
        estado: estado ?? 'SP',
      })
    }

    const donation = await donationService.createDonation(session.id, {
      portions,
      windowStart,
      windowEnd,
      address: {
        cep: cep ?? '',
        logradouro: '',
        bairro: bairro ?? '',
        cidade: cidade ?? '',
        estado: estado ?? 'SP',
        lat: location.lat,
        lng: location.lng,
      },
      radiusKm: 5,
      type: DonationType.REGULAR,
      description: 'Sobrou! Doação urgente.',
    })

    // Notificar receptores próximos em background (best-effort, raio 3km)
    notificationService
      .notifyNearbyRecipients(donation.id, location, portions, 3)
      .catch((err) => console.warn('[publishSobrouAction] Push error:', err))

    revalidatePath('/doador')
    redirect('/doador')

    return { data: donation, error: null, status: 201 }
  } catch (err) {
    if (err instanceof Error && err.name === 'GeocodingError') {
      return {
        data: null,
        error: 'CEP não encontrado. Verifique e tente novamente.',
        status: 503,
      }
    }
    console.error('[publishSobrouAction]', err)
    return { data: null, error: 'Erro ao publicar. Tente novamente.', status: 500 }
  }
}

// ---------------------------------------------------------------------------
// cancelDonacaoAction — Cancelar doação via ConfirmDialog
// @see module-8-doacao-form/TASK-4/ST004
// ---------------------------------------------------------------------------

export async function cancelDonacaoAction(donationId: string): Promise<ActionResponse<{ cancelled: boolean }>> {
  const session = await requireSession()

  try {
    await donationService.cancelDonation(donationId, session.id)

    // Notificar receptores com reserva ativa (best-effort)
    notificationService.notifyReservationCancelled(donationId).catch((err) =>
      console.warn('[cancelDonacaoAction] Push error:', err)
    )

    revalidatePath('/doador')
    return { data: { cancelled: true }, error: null, status: 200 }
  } catch (err) {
    if (err instanceof Error && err.name === 'DonationOwnershipError') {
      return { data: null, error: err.message, status: 403 }
    }
    if (err instanceof Error && err.name === 'DonationStatusError') {
      return { data: null, error: err.message, status: 422 }
    }
    console.error('[cancelDonacaoAction]', err)
    return { data: null, error: 'Erro ao cancelar doação.', status: 500 }
  }
}

// ---------------------------------------------------------------------------
// listDonations — Listagem de doações ativas (stub substituído)
// ---------------------------------------------------------------------------

export async function listDonations(params?: {
  page?: number
  status?: string
  dateFrom?: string
  dateTo?: string
  lat?: number
  lng?: number
}): Promise<{ data: Record<string, unknown>[]; total: number }> {
  const session = await requireSession()

  if (params?.lat != null && params?.lng != null) {
    const nearby = await donationRepository.findAvailableNear(
      { lat: params.lat, lng: params.lng },
      5
    )
    return {
      data: nearby as unknown as Record<string, unknown>[],
      total: nearby.length,
    }
  }

  const filters: {
    status?: DonationStatus
    dateFrom?: Date
    dateTo?: Date
  } = {}

  if (params?.status && Object.values(DonationStatus).includes(params.status as DonationStatus)) {
    filters.status = params.status as DonationStatus
  }
  if (params?.dateFrom) {
    filters.dateFrom = new Date(params.dateFrom)
  }
  if (params?.dateTo) {
    // Set to end of day so the filter is inclusive
    const d = new Date(params.dateTo)
    d.setHours(23, 59, 59, 999)
    filters.dateTo = d
  }

  const result = await donationRepository.findByDonorId(
    session.id,
    { page: params?.page ?? 1, limit: 20 },
    Object.keys(filters).length > 0 ? filters : undefined
  )

  return {
    data: result.items as unknown as Record<string, unknown>[],
    total: result.total,
  }
}

// ---------------------------------------------------------------------------
// getDonationById
// ---------------------------------------------------------------------------

export async function getDonationById(id: string): Promise<ActionResponse<Donation | null>> {
  await requireSession()
  const donation = await donationRepository.findById(id)
  return { data: donation, error: null, status: 200 }
}

// ---------------------------------------------------------------------------
// closeDonation — Concluir doação manualmente
// ---------------------------------------------------------------------------

export async function closeDonation(donationId: string): Promise<ActionResponse<{ completed: boolean }>> {
  const session = await requireSession()

  const donation = await donationRepository.findById(donationId)
  if (!donation) {
    return { data: null, error: 'Doação não encontrada.', status: 404 }
  }
  if (donation.donorId !== session.id) {
    return { data: null, error: 'Você não tem permissão para concluir esta doação.', status: 403 }
  }

  await donationService.completeDonation(donationId)
  revalidatePath('/doador')

  return { data: { completed: true }, error: null, status: 200 }
}

// ---------------------------------------------------------------------------
// getDonorMetrics — Métricas de impacto do doador (para ImpactoCard)
// @see module-8-doacao-form/TASK-4/ST006
// ---------------------------------------------------------------------------

export async function getDonorMetrics() {
  const session = await requireSession()
  return donationService.getDonorMetrics(session.id, session.role as string)
}

// ---------------------------------------------------------------------------
// createDonation — Alias de compatibilidade com páginas front-end existentes
// As páginas /doador/nova e /doador/sobrou usam esta assinatura legada.
// A implementação completa é createDoacaoAction (usa FormData + redirect).
// ---------------------------------------------------------------------------

export async function createDonation(_data: {
  title: string
  description?: string
  servings: number
  windowStart: string
  windowEnd: string
  address: string
  photos?: string[]
}): Promise<void> {
  // Stub de compatibilidade: front-end pages usam esta assinatura.
  // Backend real implementado em createDoacaoAction e publishSobrouAction.
  // TODO (module-8 FE tasks): substituir chamada por createDoacaoAction.
  throw new Error('Use createDoacaoAction para criar doações.')
}

// ---------------------------------------------------------------------------
// confirmWithdrawal — Confirmação de retirada (placeholder para module-10)
// ---------------------------------------------------------------------------

export async function confirmWithdrawal(_codeId: string): Promise<ActionResponse<{ confirmed: boolean }>> {
  // Implementado em module-10-codigos-historico
  return { data: null, error: 'Implementado em module-10.', status: 501 }
}
