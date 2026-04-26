/**
 * GET /api/v1/sponsors/history
 * Histórico paginado de compras de patrocínio do usuário autenticado (Should — INT-041).
 *
 * @see module-13-sponsor-checkout/TASK-4/ST001
 * INT-041: Histórico de patrocínios (Should)
 */

import { type NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth/session'
import { sponsorRepository } from '@/repositories/sponsor.repository'
import { sponsorHistoryQuerySchema } from '@/schemas/sponsor.schema'
import { errorResponse } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // 1. Exige autenticação
  let session: Awaited<ReturnType<typeof requireSession>>
  try {
    session = await requireSession()
  } catch {
    return NextResponse.json(
      errorResponse('Autenticação necessária', 'AUTH_001'),
      { status: 401 }
    )
  }

  // 2. Valida query params
  const searchParams = Object.fromEntries(request.nextUrl.searchParams)
  const parseResult = sponsorHistoryQuerySchema.safeParse(searchParams)

  if (!parseResult.success) {
    return NextResponse.json(
      errorResponse('Parâmetros de paginação inválidos', 'VAL_001'),
      { status: 400 }
    )
  }

  const { page, pageSize } = parseResult.data

  try {
    // 3. Busca histórico + total investido em paralelo
    const [{ items, total }, totalInvested] = await Promise.all([
      sponsorRepository.findPurchasesByUser(session.id, page, pageSize),
      sponsorRepository.getTotalInvested(session.id),
    ])

    // 4. Mapeia para resposta (sem dados sensíveis)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedItems = items.map((purchase: any) => ({
      id: purchase.id,
      marmitariaName: purchase.marmitaria?.tradeName ?? '—',
      quantity: purchase.quantity,
      totalAmount: Number(purchase.totalAmount),
      paymentMethod: purchase.paymentMethod as string,
      paymentStatus: purchase.paymentStatus as string,
      createdAt: purchase.createdAt,
    }))

    return NextResponse.json({
      items: mappedItems,
      total,
      totalInvested,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    console.error('[GET /api/v1/sponsors/history] Erro interno:', err)
    return NextResponse.json(
      errorResponse('Erro interno ao buscar histórico', 'SYS_001'),
      { status: 500 }
    )
  }
}
