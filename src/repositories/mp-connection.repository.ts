/**
 * MPConnectionRepository — CRUD para conexões MercadoPago Connect.
 * Todos os tokens são armazenados criptografados via lib/mp-crypto.ts.
 *
 * INT-097, INT-117 | TASK-2 module-12-mp-connect
 */
import { MPConnectionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/mp-crypto'

export interface CreateMPConnectionDTO {
  marmitariaId: string
  accessToken: string   // plaintext — será criptografado aqui
  refreshToken: string  // plaintext — será criptografado aqui
  expiresAt: Date
  mpUserId: string
  publicKey?: string
  liveMode?: boolean
}

export interface UpdateTokensDTO {
  accessToken: string  // plaintext
  refreshToken: string // plaintext
  expiresAt: Date
}

export const mpConnectionRepository = {
  /**
   * Upsert por marmitariaId — reconexão sobrescreve sem duplicar.
   */
  async create(data: CreateMPConnectionDTO) {
    return prisma.mPConnection.upsert({
      where: { marmitariaId: data.marmitariaId },
      create: {
        marmitariaId: data.marmitariaId,
        mpUserId: data.mpUserId,
        accessTokenEncrypted: encrypt(data.accessToken),
        refreshTokenEncrypted: encrypt(data.refreshToken),
        expiresAt: data.expiresAt,
        publicKey: data.publicKey ?? null,
        liveMode: data.liveMode ?? false,
        status: MPConnectionStatus.CONNECTED,
      },
      update: {
        mpUserId: data.mpUserId,
        accessTokenEncrypted: encrypt(data.accessToken),
        refreshTokenEncrypted: encrypt(data.refreshToken),
        expiresAt: data.expiresAt,
        publicKey: data.publicKey ?? null,
        liveMode: data.liveMode ?? false,
        status: MPConnectionStatus.CONNECTED,
      },
    })
  },

  /**
   * Busca conexão ativa por marmitariaId.
   */
  async findByMarmitariaId(marmitariaId: string) {
    return prisma.mPConnection.findUnique({
      where: { marmitariaId },
    })
  },

  /**
   * Atualiza tokens criptografados após refresh.
   */
  async updateTokens(id: string, data: UpdateTokensDTO) {
    await prisma.mPConnection.update({
      where: { id },
      data: {
        accessTokenEncrypted: encrypt(data.accessToken),
        refreshTokenEncrypted: encrypt(data.refreshToken),
        expiresAt: data.expiresAt,
        status: MPConnectionStatus.CONNECTED,
      },
    })
  },

  /**
   * Marca conexão como NEEDS_RECONNECT após falha no refresh.
   */
  async markNeedsReconnect(id: string) {
    await prisma.mPConnection.update({
      where: { id },
      data: { status: MPConnectionStatus.NEEDS_RECONNECT },
    })
  },

  /**
   * Remove conexão MP da marmitaria (desconexão manual).
   */
  async delete(marmitariaId: string) {
    await prisma.mPConnection.delete({
      where: { marmitariaId },
    })
  },

  /**
   * Retorna conexões CONNECTED que expiram dentro de N minutos.
   * Usado pelo cron do module-23 para refresh proativo.
   */
  async findExpiringSoon(withinMinutes: number) {
    const threshold = new Date(Date.now() + withinMinutes * 60 * 1000)
    return prisma.mPConnection.findMany({
      where: {
        status: MPConnectionStatus.CONNECTED,
        expiresAt: { lte: threshold },
      },
    })
  },

  /**
   * Descriptografa e retorna o accessToken em plaintext.
   * Encapsula criptografia para que chamadores não lidem com ela diretamente.
   */
  decryptAccessToken(encrypted: string): string {
    return decrypt(encrypted)
  },
}
