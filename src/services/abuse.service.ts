/**
 * AbuseService — detecção e gestão de abuso por IP + fingerprint.
 * Progressão de bloqueio: 1 → 2 → 3 dias (INT-065).
 * Mensagens amigáveis sem linguagem punitiva (INT-066).
 * @see module-9-retirada-publica/TASK-3
 */

import { prisma } from '@/lib/prisma'
import { addDays } from '@/utils/date'

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface AbuseCheckResult {
  blocked: boolean
  reason?: string
  unblockedAt?: Date
}

export interface RecordAbuseResult {
  blockedUntil: Date
  durationDays: number
  message: string
}

// ---------------------------------------------------------------------------
// AbuseService
// ---------------------------------------------------------------------------

export class AbuseService {
  /**
   * Verifica se IP, fingerprint ou usuário está bloqueado.
   * Bloqueio por fingerprint prevalece mesmo com IP diferente (VPN).
   * ONGs (isRedistributor=true) são isentas de qualquer bloqueio (CL-074).
   * @see module-9-retirada-publica/TASK-3/ST002
   * @see intake-review/TASK-3/ST002
   */
  async checkAbuse(
    ipAddress: string,
    fingerprint: string | null,
    userId?: string
  ): Promise<AbuseCheckResult> {
    // Isenção para ONGs — isRedistributor=true nunca é bloqueado (CL-074)
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isRedistributor: true },
      })
      if (user?.isRedistributor) return { blocked: false, reason: 'ONG_EXEMPT' }
    }

    const now = new Date()

    const record = await prisma.abuseRecord.findFirst({
      where: {
        AND: [
          { blockedUntil: { gt: now } },
          {
            OR: [
              { ipAddress },
              ...(fingerprint ? [{ fingerprint }] : []),
              ...(userId ? [{ userId }] : []),
            ],
          },
        ],
      },
    })

    if (!record || !record.blockedUntil) return { blocked: false }

    const isIpBlock = record.ipAddress === ipAddress
    const reason = isIpBlock
      ? 'IP com muitas solicitações recentes'
      : 'Dispositivo com muitas solicitações recentes'

    return {
      blocked: true,
      reason,
      unblockedAt: record.blockedUntil,
    }
  }

  /**
   * Registra abuso e aplica progressão de bloqueio: 1 → 3 → 7 dias + escalonamento (CL-075).
   * ONGs (isRedistributor=true) são isentas — abuso não é registrado (CL-074).
   * Mensagens sem palavras "bloqueado" ou linguagem punitiva (INT-066).
   * Audit log com IncidentType.ABUSE — nunca persiste fingerprint completo (LGPD).
   * @see module-9-retirada-publica/TASK-3/ST003
   * @see intake-review/TASK-3/ST002+ST003
   */
  async recordAbuse(
    ipAddress: string,
    fingerprint: string | null,
    reason: string,
    userId?: string
  ): Promise<RecordAbuseResult> {
    const now = new Date()

    // Isenção para ONGs — não registrar abuso (CL-074)
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isRedistributor: true },
      })
      if (user?.isRedistributor) {
        return {
          blockedUntil: now,
          durationDays: 0,
          message: 'ONG isenta de restrições.',
        }
      }
    }

    // Buscar registro existente para calcular progressão
    const existing = await prisma.abuseRecord.findFirst({
      where: {
        OR: [
          { ipAddress },
          ...(fingerprint ? [{ fingerprint }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
    })

    const blockCount = (existing?.blockCount ?? 0) + 1

    // Progressão: 1d → 3d → 7d → escalonamento exponencial (CL-075)
    let durationDays: number
    if (blockCount === 1) {
      durationDays = 1
    } else if (blockCount === 2) {
      durationDays = 3
    } else if (blockCount === 3) {
      durationDays = 7
    } else {
      // Escalonamento: 14d, 28d, 56d... (7 * 2^(n-3))
      durationDays = Math.round(7 * Math.pow(2, blockCount - 3))
    }

    const blockedUntil = addDays(now, durationDays)

    const messages: Record<number, string> = {
      1: 'Você atingiu o limite de solicitações. Tente novamente amanhã.',
      3: 'Você atingiu o limite de solicitações novamente. Tente em 3 dias.',
      7: 'Para proteger as doações, seu acesso foi temporariamente suspenso por 7 dias.',
    }
    const message = messages[Math.min(durationDays, 7)] ??
      `Seu acesso foi temporariamente suspenso por ${durationDays} dias.`

    if (existing) {
      await prisma.abuseRecord.update({
        where: { id: existing.id },
        data: {
          blockCount,
          blockedUntil,
          reason,
          ipAddress, // Atualiza IP (pode ter mudado via VPN)
        },
      })
    } else {
      await prisma.abuseRecord.create({
        data: {
          ipAddress,
          fingerprint: fingerprint ? fingerprint.slice(0, 8) + '***' : null, // LGPD: hash parcial
          blockCount,
          blockedUntil,
          reason,
        },
      })
    }

    // Audit log com IncidentType.ABUSE — sem fingerprint completo (LGPD)
    try {
      await prisma.auditLog.create({
        data: {
          action: 'ABUSE',
          entityType: 'AbuseRecord',
          ipAddress: ipAddress.slice(0, 45),
          metadata: { reason, durationDays, blockCount },
        },
      })
    } catch {
      // Falha no audit log não deve quebrar o fluxo principal
    }

    // Detecção de reincidência: 3+ incidentes em 30 dias → criar AdminAlert (CL-085)
    if (userId) {
      try {
        await this._checkAndCreateReincidenceAlert(userId)
      } catch {
        // Falha na criação do alerta não deve interromper o fluxo
      }
    }

    return { blockedUntil, durationDays, message }
  }

  /**
   * Verifica se usuário atingiu 3+ incidentes em 30 dias e cria AdminAlert de reincidência.
   * Não cria alerta duplicado se já existe alerta não lido para o mesmo usuário.
   * @see intake-review/TASK-8/ST001
   */
  private async _checkAndCreateReincidenceAlert(userId: string): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const incidentCount = await prisma.auditLog.count({
      where: {
        userId,
        action: 'ABUSE',
        createdAt: { gte: thirtyDaysAgo },
      },
    })

    if (incidentCount < 3) return

    // Verificar se já existe alerta de reincidência não lido para evitar duplicatas
    const existingAlert = await prisma.adminAlert.findFirst({
      where: { userId, type: 'REINCIDENCIA', read: false },
    })
    if (existingAlert) return

    // Buscar nome do usuário para a mensagem
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    })

    await prisma.adminAlert.create({
      data: {
        type: 'REINCIDENCIA',
        userId,
        message: `Usuário ${user?.name ?? userId} atingiu ${incidentCount} incidentes em 30 dias.`,
        read: false,
      },
    })
  }

  /**
   * Desbloqueio administrativo. Limpa blockedUntil, mantém blockCount.
   * @see module-9-retirada-publica/TASK-3/ST005
   */
  async unblockReceptor(
    identifier: string, // IP ou userId
    adminId: string,
    reason: string
  ): Promise<void> {
    // Validar que adminId tem role ADMIN
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    })

    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('AUTH_001 — Acesso negado.')
    }

    await prisma.abuseRecord.updateMany({
      where: {
        OR: [
          { ipAddress: identifier },
          { userId: identifier },
        ],
      },
      data: {
        blockedUntil: null, // Desbloqueia; blockCount mantido para futura progressão
      },
    })

    // Audit log do desbloqueio
    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'UNBLOCK',
          entityType: 'AbuseRecord',
          metadata: { identifier, reason, action: 'UNBLOCK', adminId },
        },
      })
    } catch {
      // Falha no audit log não deve quebrar o fluxo
    }
  }
}

export const abuseService = new AbuseService()
