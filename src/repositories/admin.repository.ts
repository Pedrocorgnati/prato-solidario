/**
 * AdminRepository — queries para AdminAction e AuditLog de ações administrativas.
 * Transação atômica garante que AdminAction e AuditLog são criados ou revertidos juntos.
 * @see module-15-admin-dashboard/TASK-3/ST001
 */

import { prisma } from '@/lib/prisma'
import { AdminActionType } from '@/types/enums'
import type { AdminAction, User } from '@prisma/client'

export interface AdminActionData {
  adminId: string
  type: AdminActionType
  targetId: string
  targetType: string
  reason: string
  metadata?: Record<string, unknown>
}

export class AdminRepository {
  /**
   * Confirma que usuário existe e tem role ADMIN.
   * Retorna null se não encontrado ou sem role ADMIN.
   */
  async findAdminById(adminId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id: adminId },
    })
    if (!user || user.role !== 'ADMIN') return null
    return user
  }

  /**
   * Cria AdminAction e AuditLog em transação atômica.
   * Falha em qualquer insert reverte ambos.
   * Nota: AdminAction.targetType não existe no schema — armazenado em metadata.
   */
  async createAdminActionWithAudit(data: AdminActionData): Promise<AdminAction> {
    return prisma.$transaction(async (tx) => {
      const enrichedMetadata = {
        ...data.metadata,
        targetType: data.targetType,
      }

      const adminAction = await tx.adminAction.create({
        data: {
          adminId: data.adminId,
          targetId: data.targetId,
          action: data.type,
          reason: data.reason,
          metadata: enrichedMetadata,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: data.adminId,
          action: data.type,
          entityType: data.targetType,
          entityId: data.targetId,
          metadata: {
            adminActionId: adminAction.id,
            reason: data.reason,
            ...data.metadata,
          },
        },
      })

      return adminAction
    })
  }

  /**
   * Lista ações admin com filtros opcionais.
   */
  async listAdminActions(options: {
    adminId?: string
    type?: AdminActionType
    limit?: number
  }): Promise<AdminAction[]> {
    return prisma.adminAction.findMany({
      where: {
        ...(options.adminId ? { adminId: options.adminId } : {}),
        ...(options.type ? { action: options.type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit ?? 50,
    })
  }
}

export const adminRepository = new AdminRepository()
