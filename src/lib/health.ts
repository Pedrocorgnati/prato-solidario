import { prisma } from '@/lib/prisma'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export type CheckStatus = 'ok' | 'degraded' | 'down'

export type CheckResult = {
  status: CheckStatus
  latencyMs: number
  error?: string
}

/**
 * Sanitiza mensagens de erro para o payload público.
 * Remove connection strings, credenciais, IPs e hostnames internos.
 * O erro completo é logado internamente via logger.error.
 */
function sanitizeErrorForPublic(err: unknown, label: string): string {
  const raw = err instanceof Error ? err.message : String(err)
  // Logar erro completo internamente para diagnóstico
  logger.error({ err, check: label }, `health check ${label} failed`)
  // Retornar apenas categoria genérica — nunca expor detalhes de conexão
  if (raw.includes('timeout')) return 'timeout'
  if (raw.includes('ECONNREFUSED') || raw.includes('connection')) return 'connection error'
  if (raw.includes('ENOTFOUND') || raw.includes('DNS')) return 'dns error'
  return 'check failed'
}

export type HealthCheckResult = {
  status: CheckStatus
  version: string
  uptime: number
  timestamp: string
  checks: {
    db: CheckResult
    auth: CheckResult
    storage: CheckResult
  }
}

const TIMEOUT_MS = 3000

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms),
    ),
  ])
}

async function checkDb(): Promise<CheckResult> {
  const start = Date.now()
  try {
    await withTimeout(
      prisma.$queryRaw`SELECT 1`,
      TIMEOUT_MS,
      'db',
    )
    return { status: 'ok', latencyMs: Date.now() - start }
  } catch (err) {
    return {
      status: 'down',
      latencyMs: Date.now() - start,
      error: sanitizeErrorForPublic(err, 'db'),
    }
  }
}

async function checkAuth(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = await createSupabaseAdminClient()
    // Ping de conectividade: busca usuário inexistente — apenas testa a conexão
    await withTimeout(
      supabase.auth.admin.listUsers({ page: 1, perPage: 1 }),
      TIMEOUT_MS,
      'auth',
    )
    return { status: 'ok', latencyMs: Date.now() - start }
  } catch (err) {
    return {
      status: 'degraded',
      latencyMs: Date.now() - start,
      error: sanitizeErrorForPublic(err, 'auth'),
    }
  }
}

async function checkStorage(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = await createSupabaseAdminClient()
    await withTimeout(
      supabase.storage.listBuckets(),
      TIMEOUT_MS,
      'storage',
    )
    return { status: 'ok', latencyMs: Date.now() - start }
  } catch (err) {
    return {
      status: 'degraded',
      latencyMs: Date.now() - start,
      error: sanitizeErrorForPublic(err, 'storage'),
    }
  }
}

/**
 * Executa os três health checks em paralelo e retorna resultado consolidado.
 * DB down → status geral 'down'. Outros falhos → 'degraded'.
 */
export async function runHealthChecks(): Promise<HealthCheckResult> {
  const [dbResult, authResult, storageResult] = await Promise.allSettled([
    checkDb(),
    checkAuth(),
    checkStorage(),
  ])

  const db: CheckResult =
    dbResult.status === 'fulfilled'
      ? dbResult.value
      : { status: 'down', latencyMs: 0, error: String(dbResult.reason) }

  const auth: CheckResult =
    authResult.status === 'fulfilled'
      ? authResult.value
      : { status: 'degraded', latencyMs: 0, error: String(authResult.reason) }

  const storage: CheckResult =
    storageResult.status === 'fulfilled'
      ? storageResult.value
      : { status: 'degraded', latencyMs: 0, error: String(storageResult.reason) }

  let overallStatus: CheckStatus = 'ok'
  if (db.status === 'down') {
    overallStatus = 'down'
  } else if (auth.status !== 'ok' || storage.status !== 'ok') {
    overallStatus = 'degraded'
  }

  const result: HealthCheckResult = {
    status: overallStatus,
    version: process.env.npm_package_version ?? '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: { db, auth, storage },
  }

  logger.info({ route: '/api/health', status: overallStatus, checks: result.checks }, 'health check')

  return result
}
