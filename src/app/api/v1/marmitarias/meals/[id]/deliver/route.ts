/**
 * POST /api/v1/marmitarias/meals/[id]/deliver
 * Confirma entrega de marmita patrocinada.
 * Suporta confirmação por ID de meal ou por código de retirada (body `{ code: string }`).
 *
 * @see module-14-painel-marmitaria/TASK-2/ST002
 * INT-043: Confirmação de entrega | Contrato-4: RetrievalCode
 * DB-007: Balance negative guard
 */

import { type NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { marmitariaRepository } from '@/repositories/marmitaria.repository'
import { marmitariaDeliveryService } from '@/services/marmitaria-delivery.service'
import { errorResponse } from '@/types/api'
import { deliverByCodeSchema } from '@/schemas/marmitaria.schema'
import {
  MealNotFoundError,
  MealOwnershipError,
  MealAlreadyDeliveredError,
  MealNotReservedError,
  MarmitariaNotActiveError,
  InvalidCodeError,
} from '@/services/marmitaria-delivery.service'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Autenticação — exige role MARMITARIA
    const user = await requireRole(['MARMITARIA'])

    // 2. Carregar perfil
    const profile = await marmitariaRepository.findProfileByUserId(user.id)
    if (!profile) {
      return NextResponse.json(
        errorResponse('Perfil de marmitaria não encontrado', 'AUTH_008'),
        { status: 404 }
      )
    }

    // 3. Parse body — verificar se é confirmação por código ou por ID
    let body: unknown = {}
    try {
      const rawBody = await request.text()
      if (rawBody) body = JSON.parse(rawBody)
    } catch {
      // body vazio ou inválido — ok para confirmação por ID
    }

    const { id: mealId } = await params
    const isCodeConfirmation = body && typeof body === 'object' && 'code' in body

    let result: Awaited<ReturnType<typeof marmitariaDeliveryService.confirmById>>

    if (isCodeConfirmation) {
      // 4a. Confirmação por código manual (INT-043)
      const parseResult = deliverByCodeSchema.safeParse(body)
      if (!parseResult.success) {
        return NextResponse.json(
          errorResponse(
            parseResult.error.issues[0]?.message ?? 'Código inválido',
            'VAL_001'
          ),
          { status: 422 }
        )
      }

      result = await marmitariaDeliveryService.confirmByCode(
        parseResult.data.code,
        profile.id,
        profile.status,
        user.id
      )
    } else {
      // 4b. Confirmação por ID da marmita
      if (!mealId || mealId === 'undefined') {
        return NextResponse.json(
          errorResponse('ID da marmita inválido', 'VAL_001'),
          { status: 422 }
        )
      }

      result = await marmitariaDeliveryService.confirmById(
        mealId,
        profile.id,
        profile.status,
        user.id
      )
    }

    return NextResponse.json(result, { status: 200 })
  } catch (err: unknown) {
    if (err instanceof MarmitariaNotActiveError) {
      return NextResponse.json(
        errorResponse(err.message, (err as MarmitariaNotActiveError).code),
        { status: 403 }
      )
    }

    if (err instanceof MealOwnershipError) {
      return NextResponse.json(
        errorResponse(err.message, 'AUTH_011'),
        { status: 403 }
      )
    }

    if (err instanceof MealAlreadyDeliveredError) {
      return NextResponse.json(
        errorResponse(err.message, 'SYS_009'),
        { status: 409 }
      )
    }

    if (err instanceof MealNotReservedError) {
      return NextResponse.json(
        errorResponse(err.message, 'VAL_002'),
        { status: 422 }
      )
    }

    if (err instanceof MealNotFoundError) {
      return NextResponse.json(
        errorResponse('Marmita não encontrada', 'SYS_080'),
        { status: 404 }
      )
    }

    if (err instanceof InvalidCodeError) {
      return NextResponse.json(
        errorResponse(err.message, 'VAL_003'),
        { status: 422 }
      )
    }

    console.error('[POST /api/v1/marmitarias/meals/[id]/deliver] Erro interno:', err)
    return NextResponse.json(
      errorResponse('Erro interno ao confirmar entrega', 'SYS_001'),
      { status: 500 }
    )
  }
}
