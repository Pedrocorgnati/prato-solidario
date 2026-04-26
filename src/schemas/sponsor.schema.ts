/**
 * Zod schemas para validação de dados de patrocínio.
 * @see module-13-sponsor-checkout/TASK-1/ST003
 */

import { z } from 'zod'
import { PaymentMethod } from '@/types/enums'

export const sponsorPurchaseDTOSchema = z.object({
  marmitariaId: z.string().uuid('marmitariaId deve ser um UUID válido'),
  quantity: z
    .number()
    .int()
    .min(5, 'Mínimo 5 marmitas por compra')
    .max(100, 'Máximo 100 marmitas por compra'),
  guestEmail: z.string().email('Formato de e-mail inválido').optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
})

export const sponsorHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
})

export const marmitariasPublicQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  // Geo-filter opcionais — TASK-9 CL-101
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(50).default(5),
})

export type SponsorPurchaseDTOInput = z.infer<typeof sponsorPurchaseDTOSchema>
export type SponsorHistoryQuery = z.infer<typeof sponsorHistoryQuerySchema>
export type MarmitariasPublicQuery = z.infer<typeof marmitariasPublicQuerySchema>
