import { prisma } from '@/lib/prisma'

export class AuditLogRepository {
  async log(
    action: string,
    entityType: string,
    options?: {
      userId?: string
      entityId?: string
      metadata?: Record<string, unknown>
      ipAddress?: string
    }
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action,
        entityType,
        userId: options?.userId ?? null,
        entityId: options?.entityId ?? null,
        metadata: options?.metadata ? (options.metadata as import('@prisma/client').Prisma.InputJsonValue) : undefined,
        ipAddress: options?.ipAddress ?? null,
      },
    })
  }
}

export const auditLogRepository = new AuditLogRepository()
