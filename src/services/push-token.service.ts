import { pushTokenRepository } from '@/repositories/push-token.repository'
import type { PushToken } from '@prisma/client'
import type { RegisterPushTokenInput } from '@/schemas/push-token.schema'

export class PushTokenService {
  async register(dto: RegisterPushTokenInput): Promise<PushToken> {
    return pushTokenRepository.upsert(dto)
  }

  async remove(token: string): Promise<void> {
    await pushTokenRepository.deactivate(token)
  }

  async getByUserId(userId: string): Promise<PushToken[]> {
    return pushTokenRepository.findByUserId(userId)
  }
}

export const pushTokenService = new PushTokenService()
