/**
 * POST /api/v1/sponsors/purchases
 * Inicia checkout de patrocínio — guest ou autenticado (INT-034).
 *
 * @see module-13-sponsor-checkout/TASK-3/ST001
 * INT-034: Guest checkout | INT-038: Checkout MP | INT-099: Token da marmitaria
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/session'
import { sponsorService } from '@/services/sponsor.service'
import { sponsorPurchaseDTOSchema } from '@/schemas/sponsor.schema'
import { PurchaseStatus } from '@prisma/client'
import { errorResponse } from '@/types/api'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// ---------------------------------------------------------------------------
// GET /api/v1/sponsors/purchases
// Retorna histórico paginado de compras do patrocinador autenticado.
// @see module-13-sponsor-checkout/TASK-11/ST001
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json(errorResponse('Não autenticado', 'AUTH_001'), { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const status = searchParams.get('status')

  // Rate limit: 30 req / 60 s por usuário
  const rl = await rateLimit({
    key: `sponsor-history:${session.id}`,
    limit: 30,
    windowMs: 60_000,
  })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { prisma } = await import('@/lib/prisma')

  const where = {
    sponsorId: session.id,
    ...(status ? { paymentStatus: status as PurchaseStatus } : {}),
  }

  const [purchases, total] = await Promise.all([
    prisma.sponsorPurchase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        marmitaria: { select: { tradeName: true } },
        sponsoredMeals: { select: { status: true } },
      },
    }),
    prisma.sponsorPurchase.count({ where }),
  ])

  return NextResponse.json({
    data: purchases,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse e validação do body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        errorResponse('Body da requisição inválido ou ausente', 'VAL_001'),
        { status: 400 }
      )
    }

    const parseResult = sponsorPurchaseDTOSchema.safeParse(body)
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]
      return NextResponse.json(
        errorResponse(firstError?.message ?? 'Dados inválidos', 'VAL_001'),
        { status: 400 }
      )
    }

    const dto = parseResult.data

    // 2. Resolução de identidade — guest ou autenticado (INT-034)
    const session = await getServerSession()
    const sponsorId: string | null = null

    if (!session && !dto.guestEmail) {
      return NextResponse.json(
        errorResponse('E-mail é obrigatório para compra sem cadastro', 'VAL_001'),
        { status: 400 }
      )
    }

    // Validação de e-mail para usuário autenticado (usa email da sessão, não necessita guestEmail)
    // Para guest: guestEmail já está validado pelo Zod

    // 3. Busca sponsorId se autenticado
    let resolvedSponsorId: string | null = sponsorId
    if (session) {
      const { prisma } = await import('@/lib/prisma')
      const profile = await prisma.sponsorProfile.findUnique({
        where: { userId: session.id },
        select: { id: true },
      })
      resolvedSponsorId = profile?.id ?? null
    }

    // 4. Inicia purchase + cria Preferência MP
    const result = await sponsorService.initiatePurchase(dto, resolvedSponsorId)

    return NextResponse.json(result, { status: 201 })
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string }

    if (error.code === 'AUTH_008') {
      return NextResponse.json(
        errorResponse(error.message ?? 'Marmitaria não encontrada ou inativa', 'AUTH_008'),
        { status: 422 }
      )
    }

    if (error.code === 'SYS_002') {
      return NextResponse.json(
        errorResponse('Serviço de pagamento temporariamente indisponível', 'SYS_002'),
        { status: 503 }
      )
    }

    console.error('[POST /api/v1/sponsors/purchases] Erro interno:', err)
    return NextResponse.json(
      errorResponse('Erro interno ao processar compra', 'SYS_001'),
      { status: 500 }
    )
  }
}
