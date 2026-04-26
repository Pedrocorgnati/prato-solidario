import { z } from 'zod'
import { SortOrder } from './enums'

/**
 * Schemas Zod para validação de formulários e payloads de API.
 * Todas as mensagens de erro em português.
 * @see module-2-shared-foundations/TASK-1/ST003
 */

// ---------------------------------------------------------------------------
// Helper: mapeia ZodError para ERROR-CATALOG
// ---------------------------------------------------------------------------

import type { ZodError } from 'zod'
import type { ActionResponse } from './common'

/**
 * Converte ZodError para ActionResponse com código do ERROR-CATALOG.
 * VAL_001 = campo obrigatório, VAL_002 = formato inválido, VAL_003 = range inválido
 */
export function zodToApiError(err: ZodError): ActionResponse<never> {
  const firstIssue = err.issues[0]
  const field = firstIssue?.path?.join('.') ?? 'campo'
  const message = firstIssue?.message ?? 'Erro de validação'

  let code = 'VAL_002'
  if (message.toLowerCase().includes('obrigatóri') || message.toLowerCase().includes('required')) {
    code = 'VAL_001'
  } else if (message.toLowerCase().includes('mínimo') || message.toLowerCase().includes('máximo')) {
    code = 'VAL_003'
  }

  return {
    data: null,
    error: `${code} — ${field}: ${message}`,
    status: 400,
  }
}

// ---------------------------------------------------------------------------
// Endereço BR
// ---------------------------------------------------------------------------

export const AddressBrDto = z.object({
  cep: z.string().min(8, 'CEP é obrigatório (8 dígitos)'),
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'Estado deve ter 2 letras (ex: SP)'),
})
export type AddressBrInput = z.infer<typeof AddressBrDto>

// ---------------------------------------------------------------------------
// Paginação
// ---------------------------------------------------------------------------

export const PaginationDto = z.object({
  page: z.coerce.number().int().min(1, 'Página deve ser maior que 0').default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.nativeEnum(SortOrder).optional().default(SortOrder.DESC),
})
export type PaginationInput = z.infer<typeof PaginationDto>

// ---------------------------------------------------------------------------
// Intervalo de datas
// ---------------------------------------------------------------------------

export const DateRangeDto = z.object({
  startDate: z.coerce.date({ error: 'Data de início inválida' }),
  endDate: z.coerce.date({ error: 'Data de fim inválida' }),
}).refine(data => data.endDate >= data.startDate, {
  message: 'Data de fim deve ser após a data de início',
  path: ['endDate'],
})
export type DateRangeInput = z.infer<typeof DateRangeDto>

// ---------------------------------------------------------------------------
// Usuário
// ---------------------------------------------------------------------------

export const CreateUserDto = z.object({
  email: z.string().email('E-mail inválido'),
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  phone: z.string().optional(),
  role: z.enum(['DOADOR_PF', 'DOADOR_RESTAURANTE', 'MARMITARIA', 'RECEPTOR', 'ONG', 'PATROCINADOR', 'ADMIN'], {
    error: 'Role inválido',
  }),
  password: z
    .string()
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número'),
})
export type CreateUserInput = z.infer<typeof CreateUserDto>

export const UpdateProfileDto = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').optional(),
  phone: z.string().optional(),
  photoUrl: z.string().url('URL de foto inválida').optional(),
})
export type UpdateProfileInput = z.infer<typeof UpdateProfileDto>

// ---------------------------------------------------------------------------
// Doação
// ---------------------------------------------------------------------------

export const CreateDonationDto = z.object({
  quantity: z.coerce.number().int().min(1, 'Quantidade deve ser ao menos 1'),
  windowStart: z.string().min(1, 'Horário de início é obrigatório'),
  windowEnd: z.string().min(1, 'Horário de fim é obrigatório'),
  address: AddressBrDto,
  radiusKm: z.coerce.number().min(0.1).max(50).default(5),
  notes: z.string().max(500, 'Observações devem ter até 500 caracteres').optional(),
})
export type CreateDonationInput = z.infer<typeof CreateDonationDto>

// ---------------------------------------------------------------------------
// Retirada
// ---------------------------------------------------------------------------

export const RequestRetrievalDto = z.object({
  lat: z.number().min(-90, 'Latitude deve ser entre -90 e 90').max(90, 'Latitude deve ser entre -90 e 90'),
  lng: z.number().min(-180, 'Longitude deve ser entre -180 e 180').max(180, 'Longitude deve ser entre -180 e 180'),
  quantity: z.number().int().min(1, 'Informe entre 1 e 10 pessoas.').max(10, 'Informe entre 1 e 10 pessoas.'),
  donationId: z.string().cuid().optional(), // ID preferido de doação (bypass de matching)
})
export type RequestRetrievalInput = z.infer<typeof RequestRetrievalDto>

/** Schema Zod para query params do GET /api/v1/donations/available */
export const AvailableDonationsQueryDto = z.object({
  lat: z.coerce.number().min(-90, 'Coordenadas inválidas').max(90, 'Coordenadas inválidas'),
  lng: z.coerce.number().min(-180, 'Coordenadas inválidas').max(180, 'Coordenadas inválidas'),
  radius: z.coerce.number().int().min(100).max(20000).default(5000).optional(),
  quantity: z.coerce.number().int().min(1).max(10).default(1).optional(),
})
export type AvailableDonationsQuery = z.infer<typeof AvailableDonationsQueryDto>

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

export const CreateBannerDto = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título deve ter até 100 caracteres'),
  imageUrl: z.string().url('URL de imagem inválida'),
  linkUrl: z.string().url('URL de destino inválida').optional(),
  creditDays: z.coerce.number().int().min(1, 'Dias de crédito deve ser ao menos 1'),
  scheduledAt: z.coerce.date().optional(),
})
export type CreateBannerInput = z.infer<typeof CreateBannerDto>

// ---------------------------------------------------------------------------
// Compra de patrocínio
// ---------------------------------------------------------------------------

export const CreateSponsorPurchaseDto = z.object({
  marmitariaId: z.string().uuid('ID de marmitaria inválido'),
  quantity: z.coerce.number().int().min(1, 'Quantidade deve ser ao menos 1'),
  paymentMethod: z.enum(['pix', 'credit_card', 'debit_card'], {
    error: 'Método de pagamento inválido',
  }),
})
export type CreateSponsorPurchaseInput = z.infer<typeof CreateSponsorPurchaseDto>
