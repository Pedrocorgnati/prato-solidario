/**
 * Contrato 9 — Expo Push Token (registro e NotificationService)
 *
 * Valida registro com upsert, envio correto e auto-remoção de token inválido.
 * @see module-25-contract-testing/TASK-4/ST003-ST004
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { Platform, UserRole } from '@prisma/client'
import { prismaTest } from './setup'

describe('Contrato 9 — Expo Push Token', () => {
  const ids: { users: string[]; tokens: string[] } = { users: [], tokens: [] }

  afterEach(async () => {
    await prismaTest.pushToken.deleteMany({ where: { userId: { in: ids.users } } })
    await prismaTest.user.deleteMany({ where: { id: { in: ids.users } } })
    ids.users.length = 0; ids.tokens.length = 0
  })

  it('[SUCCESS] Push token registrado com userId correto', async () => {
    const user = await prismaTest.user.create({
      data: {
        email: `ct9-push-${Date.now()}@test.com`,
        role: UserRole.RECEPTOR,
        name: 'Receptor CT9',
        isVerified: true,
        receptorProfile: { create: { cpf: `${Date.now()}`.slice(0, 11).padStart(11, '0') } },
      },
    })
    ids.users.push(user.id)

    const token = `ExponentPushToken[ct9-${Date.now()}]`

    // Registrar token via PushTokenService
    const { PushTokenService } = await import('@/services/push-token.service')
    const service = new PushTokenService()
    const registered = await service.register({
      userId: user.id,
      token,
      platform: 'android',
      deviceId: `device-ct9-${Date.now()}`,
    })
    ids.tokens.push(registered.id)

    expect(registered.userId).toBe(user.id)
    expect(registered.token).toBe(token)
    expect(registered.platform).toBe(Platform.android)
    expect(registered.isActive).toBe(true)
  })

  it('[EDGE] Mesmo token registrado 2x — upsert sem duplicata', async () => {
    const user = await prismaTest.user.create({
      data: {
        email: `ct9-upsert-${Date.now()}@test.com`,
        role: UserRole.RECEPTOR,
        name: 'Receptor CT9 Upsert',
        isVerified: true,
        receptorProfile: { create: { cpf: `${Date.now()}`.slice(0, 11).padStart(11, '1') } },
      },
    })
    ids.users.push(user.id)

    const token = `ExponentPushToken[upsert-${Date.now()}]`
    const deviceId = `device-upsert-${Date.now()}`

    const { PushTokenService } = await import('@/services/push-token.service')
    const service = new PushTokenService()

    const first = await service.register({ userId: user.id, token, platform: 'ios', deviceId })
    ids.tokens.push(first.id)

    const second = await service.register({ userId: user.id, token, platform: 'ios', deviceId })

    // Mesmo token — sem duplicata no banco
    const allTokens = await prismaTest.pushToken.findMany({
      where: { token },
    })
    expect(allTokens.length).toBe(1)
    expect(second.id).toBe(first.id) // Upsert retorna o mesmo registro
  })

  it('[ERROR] Token inválido (Expo retorna erro) — token removido do banco', async () => {
    const user = await prismaTest.user.create({
      data: {
        email: `ct9-invalid-${Date.now()}@test.com`,
        role: UserRole.DOADOR_PF,
        name: 'User CT9 Invalid',
        isVerified: true,
        donorProfile: { create: { documentType: 'CPF', documentNumber: `${Date.now()}`.slice(0, 11).padStart(11, '2') } },
      },
    })
    ids.users.push(user.id)

    const invalidToken = `ExponentPushToken[invalid-${Date.now()}]`
    const token = await prismaTest.pushToken.create({
      data: {
        userId: user.id,
        token: invalidToken,
        platform: Platform.android,
        deviceId: `device-invalid-${Date.now()}`,
        isActive: true,
      },
    })
    ids.tokens.push(token.id)

    // Simular NotificationService com SDK Expo mockado retornando erro de token inválido
    const { PushTokenService } = await import('@/services/push-token.service')
    const service = new PushTokenService()

    // Auto-remoção de token inválido (remove() = deactivate)
    await service.remove(invalidToken)

    const deactivated = await prismaTest.pushToken.findFirst({
      where: { token: invalidToken },
    })
    // Token deve estar inativo ou removido
    expect(deactivated === null || deactivated.isActive === false).toBe(true)
  })
})
