/**
 * GET /api/v1/codes/history/export
 * Exporta histórico de códigos da ONG em formato CSV.
 * Limite: 10.000 registros por exportação.
 * @see module-10-codigos-historico/TASK-3/ST003
 */

import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { getServerSession } from '@/lib/auth/session'
import { retrievalRepository } from '@/repositories/retrieval.repository'
import { formatDateTimeBr } from '@/utils/date'

// Rate limit: 5 req/hora por ongId (operação custosa)
const exportRateLimit = new Map<string, { count: number; resetAt: number }>()
const EXPORT_RATE_LIMIT = 5
const EXPORT_WINDOW_MS = 60 * 60 * 1000 // 1 hora

const querySchema = z.object({
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export async function GET(request: NextRequest) {
  // 1. Autenticação e role ONG
  const session = await getServerSession()
  if (!session) {
    return new Response(JSON.stringify({ error: 'AUTH_001', message: 'Não autenticado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if ((session.role as string) !== 'ONG') {
    return new Response(JSON.stringify({ error: 'AUTH_004', message: 'Acesso restrito a ONGs.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 2. Rate limit: 5 req/hora
  const rlKey = session.id
  const rlEntry = exportRateLimit.get(rlKey)
  const now = Date.now()
  if (rlEntry && now < rlEntry.resetAt) {
    rlEntry.count++
    if (rlEntry.count > EXPORT_RATE_LIMIT) {
      return new Response(
        JSON.stringify({ error: 'RATE_001', message: 'Limite de exportações atingido. Aguarde 1 hora.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }
  } else {
    exportRateLimit.set(rlKey, { count: 1, resetAt: now + EXPORT_WINDOW_MS })
  }

  // 3. Validar params
  const { searchParams } = request.nextUrl
  const parsed = querySchema.safeParse({
    status: searchParams.get('status') ?? undefined,
    startDate: searchParams.get('startDate') ?? undefined,
    endDate: searchParams.get('endDate') ?? undefined,
  })
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'VAL_001', message: 'Parâmetros inválidos.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { status, startDate, endDate } = parsed.data
  const statusArray = status ? status.split(',').filter(Boolean) : undefined

  try {
    const { data, total } = await retrievalRepository.getCodeHistoryForExport(session.id, {
      status: statusArray,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    })

    // Limite de 10.000 registros
    if (total > 10000) {
      return new Response(
        JSON.stringify({ error: 'VAL_003', message: 'Refine os filtros para exportar menos de 10.000 registros.' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Gerar CSV
    const headers = 'data,codigo,status,quantidade,acao\n'
    const rows = data
      .map((code) => {
        const date = formatDateTimeBr(code.createdAt)
        const status = code.status
        const action = code.confirmedAt ? 'CONFIRMED' : code.status
        return `"${date}","${code.code}","${status}","${code.portions}","${action}"`
      })
      .join('\n')

    const csv = headers + rows
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `historico-${session.id.slice(0, 8)}-${dateStr}.csv`

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[GET /api/v1/codes/history/export]', err)
    return new Response(
      JSON.stringify({ error: 'SYS_001', message: 'Erro interno.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
