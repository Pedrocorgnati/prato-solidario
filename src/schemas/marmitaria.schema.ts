/**
 * Marmitaria Schemas — validação Zod para as rotas do painel da marmitaria.
 * @see module-14-painel-marmitaria
 *
 * INT-042–046: Rotas do painel | USER_023–025: Validações de config
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Balance
// ---------------------------------------------------------------------------

export const balanceResponseSchema = z.object({
  available: z.number().int().min(0),
  pending: z.number().int().min(0),
  delivered: z.number().int().min(0),
  totalReceivedBrl: z.number().min(0),
})

export type BalanceResponse = z.infer<typeof balanceResponseSchema>

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

/** Body para confirmar entrega por código manual */
export const deliverByCodeSchema = z.object({
  code: z.string().min(1, 'Código obrigatório').max(20),
})

export type DeliverByCodeInput = z.infer<typeof deliverByCodeSchema>

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const paymentsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  pageSize: z
    .string()
    .optional()
    .transform((v) => (v ? Math.min(100, Math.max(1, parseInt(v, 10))) : 20)),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  export: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  // intake-review TASK-6/ST003 — filtro por origem (sponsor|direct|all)
  source: z.enum(['sponsor', 'direct', 'all']).optional().default('all'),
}).refine(
  (data) => {
    if (data.from && data.to) {
      return new Date(data.from) <= new Date(data.to)
    }
    return true
  },
  { message: 'Data inicial não pode ser maior que a data final', path: ['from'] }
)

export type PaymentsQuery = z.infer<typeof paymentsQuerySchema>

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const

const scheduleSchema = z.object({
  days: z
    .array(z.enum(DAYS_OF_WEEK))
    .min(1, 'Selecione ao menos 1 dia de funcionamento'), // USER_025
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Formato de horário inválido (HH:mm)'),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Formato de horário inválido (HH:mm)'),
  dailyCapacity: z
    .number()
    .int()
    .min(1, 'Capacidade mínima é 1')
    .max(500, 'Capacidade máxima é 500'),
  orderDeadlineHours: z.enum(['1', '2', '4', '8']),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: 'Horário de início deve ser menor que o horário de fim', path: ['startTime'] }
)

export const settingsUpdateSchema = z
  .object({
    schedule: scheduleSchema.optional(),
    pricePerMeal: z
      .number()
      .positive('Preço deve ser maior que zero') // USER_024
      .optional(),
    photoUrl: z
      .string()
      .url('URL de foto inválida')
      .optional(), // USER_023 — obrigatório no contexto de marmitaria sem foto
    description: z.string().max(500).optional(),
    publicAddress: z
      .object({
        neighborhood: z.string().min(2).max(100),
        city: z.string().min(2).max(100),
      })
      .optional(),
  })

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>
