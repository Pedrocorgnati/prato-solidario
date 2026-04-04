import { prisma } from '@/lib/prisma'
import type { PushToken } from '@prisma/client'
import type { RegisterPushTokenInput } from '@/schemas/push-token.schema'

export class PushTokenRepository {
  async upsert(dto: RegisterPushTokenInput): Promise<PushToken> {
    return prisma.pushToken.upsert({
      where: { token: dto.token },
      update: {
        deviceId: dto.deviceId,
        platform: dto.platform,
        userId: dto.userId ?? null,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        token: dto.token,
        deviceId: dto.deviceId,
        platform: dto.platform,
        userId: dto.userId ?? null,
        isActive: true,
      },
    })
  }

  async findByUserId(userId: string): Promise<PushToken[]> {
    return prisma.pushToken.findMany({ where: { userId, isActive: true } })
  }

  async findByToken(token: string): Promise<PushToken | null> {
    return prisma.pushToken.findUnique({ where: { token } })
  }

  async deactivate(token: string): Promise<void> {
    await prisma.pushToken.update({ where: { token }, data: { isActive: false } })
  }
}

export const pushTokenRepository = new PushTokenRepository()
