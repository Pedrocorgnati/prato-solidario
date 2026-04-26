/**
 * GET /api/v1/admin/health
 * Verifica saúde dos serviços integrados em paralelo.
 * Checks: DB (PostgreSQL), Supabase Auth, Mercado Pago, Expo Push.
 * Falha isolada não derruba outros checks (Promise.allSettled).
 * @see module-15-admin-dashboard/TASK-2/ST003
 */

import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/auth/withAdmin'
import { prisma } from '@/lib/prisma'

type ServiceStatus = 'ok' | 'degraded' | 'error' | 'not_tracked'

interface ServiceCheck {
  status: ServiceStatus
  detail: string
  latencyMs?: number
}

async function checkDb(): Promise<ServiceCheck> {
  const start = Date.now()
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000)
      ),
    ])
    const latencyMs = Date.now() - start
    return {
      status: latencyMs > 500 ? 'degraded' : 'ok',
      detail: latencyMs > 500 ? `Degradado (${latencyMs}ms)` : `OK (${latencyMs}ms)`,
      latencyMs,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'desconhecido'
    return { status: 'error', detail: `Falha: ${msg}` }
  }
}

async function checkSupabaseAuth(): Promise<ServiceCheck> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return { status: 'error', detail: 'SUPABASE_URL não configurada' }
  }
  const start = Date.now()
  try {
    const res = await Promise.race([
      fetch(`${supabaseUrl}/auth/v1/health`, { cache: 'no-store' }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000)
      ),
    ])
    const latencyMs = Date.now() - start
    if (!(res as Response).ok) {
      return { status: 'error', detail: `HTTP ${(res as Response).status}`, latencyMs }
    }
    return {
      status: latencyMs > 500 ? 'degraded' : 'ok',
      detail: latencyMs > 500 ? `Degradado (${latencyMs}ms)` : `OK (${latencyMs}ms)`,
      latencyMs,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'desconhecido'
    return { status: 'error', detail: `Falha: ${msg}` }
  }
}

export const GET = withAdmin(async () => {
  const [dbResult, supabaseResult] = await Promise.allSettled([
    checkDb(),
    checkSupabaseAuth(),
  ])

  const db: ServiceCheck =
    dbResult.status === 'fulfilled'
      ? dbResult.value
      : { status: 'error', detail: 'Exceção não capturada' }

  const supabaseAuth: ServiceCheck =
    supabaseResult.status === 'fulfilled'
      ? supabaseResult.value
      : { status: 'error', detail: 'Exceção não capturada' }

  // Mercado Pago: sem modelo de webhook log no schema atual
  const mercadoPagoWebhook: ServiceCheck = {
    status: 'not_tracked',
    detail: 'Modelo WebhookLog não disponível no schema — monitoramento pendente',
  }

  // Expo Push: verifica se há tokens ativos como proxy de saúde
  let expoPush: ServiceCheck
  try {
    const latestToken = await prisma.pushToken.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    })
    if (latestToken) {
      const ageMs = Date.now() - latestToken.updatedAt.getTime()
      const ageHours = Math.round(ageMs / 3_600_000)
      expoPush = {
        status: ageHours > 72 ? 'degraded' : 'ok',
        detail: ageHours > 72
          ? `Último token ativo atualizado há ${ageHours}h (possível inatividade)`
          : `Tokens ativos encontrados (último atualizado há ${ageHours}h)`,
      }
    } else {
      expoPush = {
        status: 'degraded',
        detail: 'Nenhum push token ativo encontrado',
      }
    }
  } catch {
    expoPush = {
      status: 'not_tracked',
      detail: 'Erro ao consultar push tokens — modelo pode não estar migrado',
    }
  }

  return NextResponse.json({ db, supabaseAuth, mercadoPagoWebhook, expoPush })
})
