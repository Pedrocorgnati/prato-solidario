/**
 * Rate limit para push notifications (anti-spam 15min por receptor).
 * Implementado com tabela `push_rate_limits` no Postgres (sem Redis).
 * @see module-8-doacao-form/TASK-3/ST004
 */

import { prisma } from '@/lib/prisma'

const PUSH_RATE_WINDOW_MS = 15 * 60 * 1000 // 15 minutos

/**
 * Verifica se o receptor pode receber push notification.
 * Retorna true se não recebeu push nos últimos 15 minutos.
 * Usa upsert atômico para evitar race condition.
 *
 * @param userId - ID do receptor
 */
export async function canReceivePush(userId: string): Promise<boolean> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - PUSH_RATE_WINDOW_MS)

  try {
    // Verificar se há registro recente de push para este usuário
    // Usando tabela notification_rate_limits via $queryRaw para atomicidade
    const result = await prisma.$queryRaw<[{ can_receive: boolean }]>`
      INSERT INTO push_rate_limits (user_id, last_push_at)
      VALUES (${userId}::uuid, ${now})
      ON CONFLICT (user_id)
      DO UPDATE SET last_push_at = ${now}
      WHERE push_rate_limits.last_push_at < ${windowStart}
      RETURNING (xmax = 0 OR push_rate_limits.last_push_at = ${now}) AS can_receive
    `

    return result[0]?.can_receive ?? true
  } catch {
    // Se a tabela não existir, usar fallback via AuditLog ou simplesmente permitir
    // push_rate_limits é criada via migration M009 (se necessário)
    console.warn('[PushRateLimit] Tabela push_rate_limits não existe — permitindo push')
    return true
  }
}
