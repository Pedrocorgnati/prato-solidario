/**
 * GET /api/v1/marmitarias/meals — Lista marmitas pendentes de entrega (RESERVED)
 * Filtra por status via query param (?status=RESERVED).
 *
 * @see module-14-painel-marmitaria/TASK-7
 */

import { NextResponse, type NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { marmitariaRepository } from '@/repositories/marmitaria.repository'
import { errorResponse } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // 3. Verificar status ativo
    if (!marmitariaRepository.isActive(profile.status)) {
      return NextResponse.json(
        errorResponse('Marmitaria não está ativa', 'AUTH_009'),
        { status: 403 }
      )
    }

    // 4. Filtrar por status (default: RESERVED)
    const status = request.nextUrl.searchParams.get('status')

    if (status === 'RESERVED' || !status) {
      const meals = await marmitariaRepository.findPendingMeals(profile.id)

      const data = meals.map((meal) => ({
        id: meal.id,
        quantity: meal.purchase?.quantity ?? 1,
        createdAt: meal.createdAt.toISOString(),
        donationId: meal.donationId,
      }))

      return NextResponse.json({ data })
    }

    // Outros status não suportados por enquanto
    return NextResponse.json(
      errorResponse('Status não suportado. Use ?status=RESERVED', 'VAL_001'),
      { status: 400 }
    )
  } catch (err) {
    console.error('[GET /api/v1/marmitarias/meals] Erro interno:', err)
    return NextResponse.json(
      errorResponse('Erro interno ao listar marmitas', 'SYS_001'),
      { status: 500 }
    )
  }
}
