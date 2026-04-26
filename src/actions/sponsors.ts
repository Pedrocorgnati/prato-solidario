'use server'

import { getServerSession } from '@/lib/auth/session'

const API_BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

/**
 * Lista histórico de patrocínios do usuário autenticado.
 * Chama GET /api/v1/sponsors/history.
 */
export async function listSponsorHistory(params?: { page?: number; pageSize?: number }) {
  const session = await getServerSession()
  if (!session) return { data: null, error: 'Não autenticado', total: 0, totalInvested: 0 }

  try {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize))

    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const cookieHeader = cookieStore.toString()

    const res = await fetch(`${API_BASE}/api/v1/sponsors/history?${searchParams}`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { data: null, error: body.message ?? 'Erro ao buscar histórico', total: 0, totalInvested: 0 }
    }

    const json = await res.json()
    return {
      data: json.items ?? [],
      total: json.total ?? 0,
      totalInvested: json.totalInvested ?? 0,
      totalPages: json.totalPages ?? 1,
      error: null,
    }
  } catch (err) {
    console.error('[listSponsorHistory]', err)
    return { data: null, error: 'Erro de conexão', total: 0, totalInvested: 0 }
  }
}

/**
 * Busca detalhes de uma compra de patrocínio por ID.
 * Chamada server-side para tela de sucesso.
 */
export async function getSponsorshipById(purchaseId: string) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const purchase = await prisma.sponsorPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        marmitaria: { select: { tradeName: true, id: true } },
      },
    })

    if (!purchase) return { data: null, error: 'Compra não encontrada' }

    return {
      data: {
        id: purchase.id,
        marmitariaName: purchase.marmitaria.tradeName,
        quantity: purchase.quantity,
        totalAmount: Number(purchase.totalAmount),
        paymentStatus: purchase.paymentStatus as string,
        createdAt: purchase.createdAt.toISOString(),
        guestEmail: purchase.guestEmail,
      },
      error: null,
    }
  } catch (err) {
    console.error('[getSponsorshipById]', err)
    return { data: null, error: 'Erro ao buscar compra' }
  }
}

/**
 * Busca lista pública de marmitarias para patrocínio.
 * Chama GET /api/v1/marmitarias/public.
 */
export async function listPublicMarmitarias(params?: { page?: number; pageSize?: number }) {
  try {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize))

    const res = await fetch(`${API_BASE}/api/v1/marmitarias/public?${searchParams}`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      return { data: [], total: 0, error: 'Erro ao listar marmitarias' }
    }

    const json = await res.json()
    return { data: json.items ?? [], total: json.total ?? 0, totalPages: json.totalPages ?? 1, error: null }
  } catch (err) {
    console.error('[listPublicMarmitarias]', err)
    return { data: [], total: 0, error: 'Erro de conexão' }
  }
}

/**
 * Busca detalhes públicos de uma marmitaria por ID.
 */
export async function getMarmitariaPublicById(marmitariaId: string) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const { MarmitariaStatus } = await import('@/types/enums')

    const profile = await prisma.marmitariaProfile.findUnique({
      where: { id: marmitariaId },
      include: {
        user: {
          select: {
            name: true,
            photoUrl: true,
            addresses: {
              where: { isPrimary: true },
              select: { bairro: true, cidade: true, logradouro: true, numero: true }, // RESOLVED: rua → logradouro (nome correto no schema Prisma)
              take: 1,
            },
          },
        },
        balance: { select: { availableCredits: true } },
      },
    })

    if (!profile || profile.status !== MarmitariaStatus.ACTIVE) {
      return { data: null, error: 'Marmitaria não encontrada ou inativa' }
    }

    const address = profile.user.addresses[0]

    return {
      data: {
        id: profile.id,
        name: profile.tradeName,
        description: null, // RESOLVED: MarmitariaProfile não tem campo description no schema
        photo: profile.user.photoUrl ?? null,
        neighborhood: address?.bairro ?? null,
        city: address?.cidade ?? null,
        address: address ? `${address.logradouro ?? ''}, ${address.numero ?? ''} — ${address.bairro ?? ''}` : null, // RESOLVED: rua → logradouro
        pricePerMeal: profile.pricePerMeal ? Number(profile.pricePerMeal) : null,
        availableCredits: profile.balance?.availableCredits ?? 0,
        schedule: profile.schedule !== null ? JSON.stringify(profile.schedule) : null, // RESOLVED: JsonValue serializado para string (MarmitariaDetail espera string | null)
      },
      error: null,
    }
  } catch (err) {
    console.error('[getMarmitariaPublicById]', err)
    return { data: null, error: 'Erro ao buscar marmitaria' }
  }
}
