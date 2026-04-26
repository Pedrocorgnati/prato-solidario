/**
 * GET /api/v1/codes/history
 * Histórico paginado de códigos de uma ONG com filtros por status e período.
 * @see module-10-codigos-historico/TASK-3/ST002
 */

import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { getServerSession } from '@/lib/auth/session'
import { retrievalRepository } from '@/repositories/retrieval.repository'

// Rate limit: 60 req/min por ongId
const historyRateLimit = new Map<string, { count: number; resetAt: number }>()
const HISTORY_RATE_LIMIT = 60

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(), // "CONFIRMED,EXPIRED,CANCELLED"
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export async function GET(request: NextRequest) {
  // 1. Autenticação e role ONG
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'AUTH_001', message: 'Não autenticado.' }, { status: 401 })
  }
  if ((session.role as string) !== 'ONG') {
    return NextResponse.json({ error: 'AUTH_004', message: 'Acesso restrito a ONGs.' }, { status: 403 })
  }

  // 2. Rate limit
  const rlKey = session.id
  const rlEntry = historyRateLimit.get(rlKey)
  const now = Date.now()
  if (rlEntry && now < rlEntry.resetAt) {
    rlEntry.count++
    if (rlEntry.count > HISTORY_RATE_LIMIT) {
      return NextResponse.json({ error: 'RATE_001', message: 'Muitas requisições.' }, { status: 429 })
    }
  } else {
    historyRateLimit.set(rlKey, { count: 1, resetAt: now + 60_000 })
  }

  // 3. Validar query params
  const { searchParams } = request.nextUrl
  const rawParams = {
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
  }
  const parsed = querySchema.safeParse(rawParams)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VAL_001', message: 'Parâmetros inválidos.', fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { page, pageSize, status, startDate, endDate } = parsed.data
  const statusArray = status ? status.split(',').filter(Boolean) : undefined

  try {
    const result = await retrievalRepository.getCodeHistoryByOngId(session.id, {
      page,
      pageSize,
      status: statusArray,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('[GET /api/v1/codes/history]', err)
    return NextResponse.json({ error: 'SYS_001', message: 'Erro interno.' }, { status: 500 })
  }
}
