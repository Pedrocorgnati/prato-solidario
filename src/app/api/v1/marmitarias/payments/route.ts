/**
 * GET /api/v1/marmitarias/payments
 * Histórico paginado de pagamentos recebidos pela marmitaria.
 * Suporta exportação CSV — nunca expõe PII do patrocinador.
 *
 * @see module-14-painel-marmitaria/TASK-3/ST003
 * INT-045: Aba pagamentos Should
 * Sanitização: sponsorId, guestEmail, cpf/cnpj do patrocinador nunca expostos
 */

import { type NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { marmitariaRepository } from '@/repositories/marmitaria.repository'
import { errorResponse } from '@/types/api'
import { paymentsQuerySchema } from '@/schemas/marmitaria.schema'

export const dynamic = 'force-dynamic'

// Cabeçalho CSV — sem PII
const CSV_HEADERS = ['ID', 'Data', 'Valor (R$)', 'Status', 'ID Transação MP', 'Marmitas']

function toCsvRow(item: {
  id: string
  createdAt: Date
  totalAmount: unknown
  paymentStatus: string
  mpPaymentId: string | null
  quantity: number
}): string {
  const date = new Date(item.createdAt).toLocaleDateString('pt-BR')
  const amount = Number(item.totalAmount).toFixed(2).replace('.', ',')
  const mpId = item.mpPaymentId ?? ''
  // Escapar campos com vírgula/aspas
  const escape = (v: string) => (v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v)

  return [
    escape(item.id),
    escape(date),
    escape(amount),
    escape(item.paymentStatus),
    escape(mpId),
    String(item.quantity),
  ].join(',')
}

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const user = await requireRole(['MARMITARIA'])

    // 2. Carregar perfil
    const profile = await marmitariaRepository.findProfileByUserId(user.id)
    if (!profile) {
      return NextResponse.json(
        errorResponse('Perfil de marmitaria não encontrado', 'AUTH_008'),
        { status: 404 }
      )
    }

    // 3. Verificar status ACTIVE
    if (!marmitariaRepository.isActive(profile.status)) {
      const code = marmitariaRepository.getStatusErrorCode(profile.status)
      return NextResponse.json(
        errorResponse('Acesso não autorizado para o status atual', code),
        { status: 403 }
      )
    }

    // 4. Validar query params
    const rawParams = Object.fromEntries(request.nextUrl.searchParams)
    const parseResult = paymentsQuerySchema.safeParse(rawParams)

    if (!parseResult.success) {
      return NextResponse.json(
        errorResponse(
          parseResult.error.issues[0]?.message ?? 'Parâmetros inválidos',
          'VAL_001'
        ),
        { status: 422 }
      )
    }

    const { page, pageSize, from, to, export: exportCsv, source } = parseResult.data

    // 5. Buscar pagamentos
    // Ressalva (TASK-6/ST003): schema atual só possui SponsorPurchase — logo
    // todos os pagamentos tem source='sponsor'. Filtro 'direct' retorna vazio.
    // Quando o modelo evoluir para incluir vendas diretas, trocar este derivador.
    const isDirectOnly = source === 'direct'

    const result = isDirectOnly
      ? { items: [], total: 0, page, pageSize, truncated: false }
      : await marmitariaRepository.findPayments({
          marmitariaId: profile.id,
          page,
          pageSize,
          from: from ? new Date(from) : undefined,
          to: to ? new Date(to) : undefined,
          exportAll: exportCsv,
        })

    // 6. Resposta CSV se solicitado
    if (exportCsv) {
      const csvLines = [
        CSV_HEADERS.join(','),
        ...result.items.map(toCsvRow),
      ]
      const csvContent = csvLines.join('\n')

      const headers = new Headers({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pagamentos-marmitaria-${new Date().toISOString().split('T')[0]}.csv"`,
        'X-Total-Records': String(result.total),
        ...(result.truncated ? { 'X-Truncated': 'true' } : {}),
      })

      return new NextResponse(csvContent, { status: 200, headers })
    }

    // 7. Resposta JSON paginada — sanitizada (sem PII do patrocinador)
    const sanitizedItems = result.items.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      amount: Number(item.totalAmount),
      status: item.paymentStatus,
      mpTransactionId: item.mpPaymentId ?? null,
      mealCount: item.quantity,
      // Todos vindos de SponsorPurchase — ver ressalva no handler
      source: 'sponsor' as const,
    }))

    return NextResponse.json({
      data: sanitizedItems,
      total: result.total,
      page: result.page ?? page,
      pageSize: result.pageSize ?? pageSize,
    })
  } catch (err) {
    console.error('[GET /api/v1/marmitarias/payments] Erro interno:', err)
    return NextResponse.json(
      errorResponse('Erro interno ao buscar pagamentos', 'SYS_001'),
      { status: 500 }
    )
  }
}
