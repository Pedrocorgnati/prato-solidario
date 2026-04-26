/**
 * GET /api/v1/marmitarias/public
 * Lista marmitarias ativas para patrocínio — SEM autenticação (INT-034).
 *
 * @see module-13-sponsor-checkout/TASK-2/ST001
 * INT-034: Sem cadastro | INT-035: Lista marmitarias
 */

import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { MarmitariaStatus } from '@/types/enums'
import { marmitariasPublicQuerySchema } from '@/schemas/sponsor.schema'
import { errorResponse } from '@/types/api'

export const dynamic = 'force-dynamic'

/**
 * Calcula distância entre dois pontos via fórmula Haversine (retorna km).
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(request: NextRequest) {
  // 1. Valida query params
  const searchParams = Object.fromEntries(request.nextUrl.searchParams)
  const parseResult = marmitariasPublicQuerySchema.safeParse(searchParams)

  if (!parseResult.success) {
    return NextResponse.json(
      errorResponse('Parâmetros inválidos', 'VAL_001'),
      { status: 400 }
    )
  }

  const { page, pageSize, lat, lng, radius } = parseResult.data
  const hasGeo = lat !== undefined && lng !== undefined

  try {
    // 2. Busca marmitarias ACTIVE com endereço e saldo
    const [profiles, total] = await prisma.$transaction([
      prisma.marmitariaProfile.findMany({
        where: { status: MarmitariaStatus.ACTIVE },
        include: {
          user: {
            select: {
              name: true,
              photoUrl: true,
              addresses: {
                where: { isPrimary: true },
                select: { bairro: true, cidade: true, lat: true, lng: true },
                take: 1,
              },
            },
          },
          balance: {
            select: { availableCredits: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        // Sem paginação aqui quando há geo (filtro no app layer)
        ...(hasGeo ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
      }),
      prisma.marmitariaProfile.count({ where: { status: MarmitariaStatus.ACTIVE } }),
    ])

    // 3. Mapeia para resposta pública (sem dados sensíveis)
    type MarmitariaItem = {
      id: string
      name: string
      photo: string | null
      neighborhood: string | null
      city: string | null
      pricePerMeal: number | null
      availableCredits: number
      schedule: unknown
      distance?: number
    }

    let items: MarmitariaItem[] = profiles.map((profile) => {
      const address = profile.user.addresses[0]
      const item: MarmitariaItem = {
        id: profile.id,
        name: profile.tradeName,
        photo: profile.user.photoUrl ?? null,
        neighborhood: address?.bairro ?? null,
        city: address?.cidade ?? null,
        pricePerMeal: profile.pricePerMeal ? Number(profile.pricePerMeal) : null,
        availableCredits: profile.balance?.availableCredits ?? 0,
        schedule: profile.schedule ?? null,
      }

      // Calcular distância se geo params fornecidos
      if (hasGeo && address?.lat && address?.lng) {
        item.distance = Math.round(haversineKm(lat!, lng!, address.lat, address.lng) * 10) / 10
      }

      return item
    })

    // 4. Filtrar e ordenar por distância se geo params fornecidos
    if (hasGeo) {
      items = items
        .filter((item) => item.distance === undefined || item.distance <= radius)
        .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))

      // Paginação manual após filtro geo
      const geoTotal = items.length
      items = items.slice((page - 1) * pageSize, page * pageSize)

      return NextResponse.json({
        items,
        total: geoTotal,
        page,
        pageSize,
        totalPages: Math.ceil(geoTotal / pageSize),
      })
    }

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    console.error('[GET /api/v1/marmitarias/public] Erro interno:', err)
    return NextResponse.json(
      errorResponse('Erro interno ao listar marmitarias', 'SYS_001'),
      { status: 500 }
    )
  }
}
