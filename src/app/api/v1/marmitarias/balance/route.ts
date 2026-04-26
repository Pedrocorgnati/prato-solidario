/**
 * GET /api/v1/marmitarias/balance
 * Saldo de marmitas disponíveis, pendentes de entrega e receita do mês.
 *
 * @see module-14-painel-marmitaria/TASK-1/ST003
 * INT-042: Painel saldo | INT-044: Saldo real-time (cache 5s)
 * DB-007: Balance negative guard — never returns negative values
 */

import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { marmitariaRepository } from '@/repositories/marmitaria.repository'
import { errorResponse } from '@/types/api'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Autenticação — exige role MARMITARIA
    const user = await requireRole(['MARMITARIA'])

    // 2. Carregar perfil com balance e status de conexão MP
    const profile = await marmitariaRepository.findProfileByUserId(user.id)

    if (!profile) {
      return NextResponse.json(
        errorResponse('Perfil de marmitaria não encontrado', 'AUTH_008'),
        { status: 404 }
      )
    }

    // 3. Verificar status — somente ACTIVE acessa o painel (Contrato-6)
    if (!marmitariaRepository.isActive(profile.status)) {
      const code = marmitariaRepository.getStatusErrorCode(profile.status)
      const messages: Record<string, string> = {
        AUTH_008: 'Marmitaria aguardando aprovação',
        AUTH_009: 'Marmitaria rejeitada',
        AUTH_010: 'Marmitaria suspensa',
      }

      return NextResponse.json(
        errorResponse(messages[code] ?? 'Acesso negado', code),
        { status: 403 }
      )
    }

    // 4. Calcular saldo real-time (DB-007 guard aplicado internamente)
    const balance = await marmitariaRepository.computeBalance(profile.id, profile.balance)

    // 5. Resposta com cache de 5s (INT-044 — suporte a polling)
    return NextResponse.json(balance, {
      headers: {
        'Cache-Control': 's-maxage=5, stale-while-revalidate=10',
        'X-Marmitaria-Status': profile.status,
        'X-MP-Connected': profile.mpConnection?.status === 'CONNECTED' ? 'true' : 'false',
      },
    })
  } catch (err) {
    // requireRole redireciona para /login ou /403 via redirect() — não chega aqui
    console.error('[GET /api/v1/marmitarias/balance] Erro interno:', err)
    return NextResponse.json(
      errorResponse('Erro interno ao consultar saldo', 'SYS_001'),
      { status: 500 }
    )
  }
}
