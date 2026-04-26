/**
 * POST /api/v1/donations — Criar doação
 * GET  /api/v1/donations — Listar doações ativas do doador autenticado
 * @see module-8-doacao-form/TASK-2/ST003
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { cepSchema } from '@/validators/cep'
import { requireSession, requireRole } from '@/lib/auth/session'
import { donationService } from '@/services/donation.service'
import { checkDonationRateLimit } from '@/lib/rate-limit'
import { toApiError } from '@/lib/api-error'
import { DonationType } from '@/types/enums'

// ---------------------------------------------------------------------------
// Schema de validação
// ---------------------------------------------------------------------------

const createDonationSchema = z.object({
  portions: z.number().int().min(1, 'Mínimo 1 porção').max(200, 'Máximo 200 porções'),
  windowStart: z.string().datetime({ message: 'windowStart deve ser uma data ISO 8601 válida' }),
  windowEnd: z.string().datetime({ message: 'windowEnd deve ser uma data ISO 8601 válida' }),
  address: z.object({
    cep: cepSchema,
    logradouro: z.string().min(1),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().min(1),
    cidade: z.string().min(1),
    estado: z.string().length(2),
  }),
  radiusKm: z.union([z.literal(1), z.literal(2), z.literal(5), z.literal(10)]).default(5),
  type: z.nativeEnum(DonationType).default(DonationType.REGULAR),
  foodType: z.enum(['REFEICAO_COMPLETA', 'PORCAO', 'LANCHE', 'SOBREMESA', 'BEBIDA', 'OUTROS']).default('OUTROS'),
  description: z.string().max(200, 'Descrição máxima de 200 caracteres').optional(),
})

// ---------------------------------------------------------------------------
// POST — Criar doação
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const session = await requireRole(['DOADOR_PF', 'DOADOR_RESTAURANTE'])

    // Rate limit: 10 doações/hora por usuário
    const rateLimit = await checkDonationRateLimit(session.id, 10, 3600)
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)
      return NextResponse.json(
        { error: { code: 'RATE_001', message: 'Limite de doações atingido. Aguarde antes de publicar uma nova.' } },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        }
      )
    }

    const body = await request.json()
    const parsed = createDonationSchema.safeParse(body)
    if (!parsed.success) {
      return toApiError(parsed.error)
    }

    const { portions, windowStart, windowEnd, address, radiusKm, type, foodType, description } = parsed.data

    const donation = await donationService.createDonation(session.id, {
      portions,
      windowStart: new Date(windowStart),
      windowEnd: new Date(windowEnd),
      address,
      radiusKm,
      type,
      foodType,
      description,
    })

    return NextResponse.json({ data: donation }, { status: 201 })
  } catch (err) {
    return toApiError(err)
  }
}

// ---------------------------------------------------------------------------
// GET — Listar doações ativas do doador autenticado
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const session = await requireSession()
    const donations = await donationService.getActiveDonations(session.id)
    return NextResponse.json({ data: donations })
  } catch (err) {
    return toApiError(err)
  }
}
