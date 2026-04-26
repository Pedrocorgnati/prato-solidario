/**
 * AdminService — orquestra ações administrativas com registro duplo obrigatório.
 * Toda ação admin passa por este service; nenhuma ocorre sem AdminAction + AuditLog.
 * @see module-15-admin-dashboard/TASK-3/ST002, ST003
 */

import { AdminActionType } from '@/types/enums'
import { adminRepository } from '@/repositories/admin.repository'
import { expoPushService } from '@/services/expo-push.service'
import { prisma } from '@/lib/prisma'
import type { AdminAction } from '@prisma/client'

export interface ExecuteAdminActionParams {
  adminId: string
  type: AdminActionType
  targetId: string
  targetType: string
  reason: string
  metadata?: Record<string, unknown>
}

export interface AdminActionResult {
  adminAction: AdminAction
  success: true
}

const PUSH_MESSAGES: Partial<Record<AdminActionType, { title: string; body: (reason: string) => string }>> = {
  [AdminActionType.APPROVE]: {
    title: 'Solicitação aprovada',
    body: () => 'Sua solicitação foi aprovada!',
  },
  [AdminActionType.REJECT]: {
    title: 'Solicitação rejeitada',
    body: (reason) => `Sua solicitação foi rejeitada. Motivo: ${reason}`,
  },
  [AdminActionType.SUSPEND]: {
    title: 'Conta suspensa',
    body: () => 'Sua conta foi temporariamente suspensa.',
  },
}

class AdminService {
  /**
   * Executa uma ação admin com validações e registro atômico.
   * Fluxo: valida admin → valida reason → valida target → registra → notifica
   */
  async executeAdminAction(params: ExecuteAdminActionParams): Promise<AdminActionResult> {
    const { adminId, type, targetId, targetType, reason, metadata } = params

    // 1. Validar que adminId existe e tem role ADMIN
    const admin = await adminRepository.findAdminById(adminId)
    if (!admin) {
      const err = new Error('Acesso negado: adminId inválido ou sem role ADMIN')
      ;(err as Error & { code: string }).code = 'AUTH_003'
      throw err
    }

    // 2. Validar reason obrigatória (mínimo 10 chars)
    if (!reason || reason.trim().length < 10) {
      const err = new Error('Justificativa obrigatória (mínimo 10 caracteres)')
      ;(err as Error & { code: string }).code = 'VAL_001'
      throw err
    }

    // 3. Validar que targetId existe
    await this.validateTarget(targetId, targetType)

    // 4. Registrar AdminAction + AuditLog atomicamente
    const adminAction = await adminRepository.createAdminActionWithAudit({
      adminId,
      type,
      targetId,
      targetType,
      reason: reason.trim(),
      metadata,
    })

    console.log(
      `[AdminService] ação executada: adminId=${adminId} type=${type} targetId=${targetId} timestamp=${new Date().toISOString()}`
    )

    // 5. Notificação push (best-effort — falha não reverte ação)
    this.sendPushNotification(targetId, type, reason).catch((err) => {
      console.warn(`[AdminService] push notification falhou (ignorado):`, err)
    })

    return { adminAction, success: true }
  }

  /**
   * Valida que o targetId existe para o targetType informado.
   * Lança erro com código específico se não encontrado.
   */
  private async validateTarget(targetId: string, targetType: string): Promise<void> {
    let exists = false

    switch (targetType.toLowerCase()) {
      case 'user':
        exists = !!(await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } }))
        break
      case 'marmitaria':
        exists = !!(await prisma.marmitariaProfile.findUnique({ where: { id: targetId }, select: { id: true } }))
        break
      case 'donation':
        exists = !!(await prisma.donation.findUnique({ where: { id: targetId }, select: { id: true } }))
        break
      case 'bannercampaign':
      case 'banner':
        exists = !!(await prisma.bannerCampaign.findUnique({ where: { id: targetId }, select: { id: true } }))
        break
      default:
        // targetType desconhecido: permitir com aviso (evita bloquear novos tipos)
        console.warn(`[AdminService] targetType desconhecido: ${targetType} — validação de existência ignorada`)
        return
    }

    if (!exists) {
      const err = new Error(`Alvo não encontrado: ${targetType}/${targetId}`)
      ;(err as Error & { code: string }).code = 'USER_080'
      throw err
    }
  }

  /**
   * Envia notificação push para o usuário-alvo da ação (ST003).
   * Busca tokens ativos do targetId no PushToken model.
   * Falha isolada — não propaga exceção.
   */
  private async sendPushNotification(
    targetId: string,
    type: AdminActionType,
    reason: string
  ): Promise<void> {
    const template = PUSH_MESSAGES[type]
    if (!template) return

    const tokens = await prisma.pushToken.findMany({
      where: { userId: targetId, isActive: true },
      select: { token: true },
    })
    if (!tokens.length) return

    await expoPushService.sendBatch(
      tokens.map((t) => ({
        to: t.token,
        title: template.title,
        body: template.body(reason),
        sound: 'default' as const,
      }))
    )
  }
}

export const adminService = new AdminService()
