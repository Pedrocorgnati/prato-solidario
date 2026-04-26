/**
 * AdminTwoFactorService — TOTP + backup codes para admins.
 * @see intake-review/TASK-2 — CL-265
 *
 * Requer `otplib` e `qrcode` instalados:
 *   npm i otplib qrcode && npm i -D @types/qrcode
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { authenticator } from 'otplib'
import { prisma } from '@/lib/prisma'
import { abuseService } from '@/services/abuse.service'

const BACKUP_CODE_COUNT = 10
const BACKUP_CODE_LEN = 10
const SCRYPT_SALT_LEN = 16
const SCRYPT_KEY_LEN = 32
const TOTP_STEP = 30

authenticator.options = { step: TOTP_STEP, window: 1 }

function hashCode(code: string): string {
  const salt = randomBytes(SCRYPT_SALT_LEN)
  const key = scryptSync(code.toLowerCase(), salt, SCRYPT_KEY_LEN)
  return `${salt.toString('hex')}:${key.toString('hex')}`
}

function verifyCodeHash(code: string, stored: string): boolean {
  const [saltHex, keyHex] = stored.split(':')
  if (!saltHex || !keyHex) return false
  const salt = Buffer.from(saltHex, 'hex')
  const expected = Buffer.from(keyHex, 'hex')
  const candidate = scryptSync(code.toLowerCase(), salt, expected.length)
  return expected.length === candidate.length && timingSafeEqual(expected, candidate)
}

function generateBackupCode(): string {
  return randomBytes(BACKUP_CODE_LEN).toString('hex').slice(0, BACKUP_CODE_LEN)
}

export class AdminTwoFactorService {
  /**
   * Gera e persiste secret pendente (enrolledAt=null ate confirmarem primeiro TOTP).
   * Retorna secret + otpauth URL pronta para QR.
   */
  async generateSecret(userId: string, accountLabel: string) {
    const secret = authenticator.generateSecret()
    await prisma.adminTwoFactor.upsert({
      where: { userId },
      update: { secret, enrolledAt: null, backupCodesHash: [], lastUsedStep: null },
      create: { userId, secret },
    })
    const otpauth = authenticator.keyuri(accountLabel, 'PratoSolidario-Admin', secret)
    return { secret, otpauth }
  }

  /**
   * Confirma enrollment: valida primeiro TOTP, gera backup codes (retornados 1 unica vez).
   */
  async confirmEnrollment(userId: string, totp: string): Promise<{ backupCodes: string[] }> {
    const record = await prisma.adminTwoFactor.findUnique({ where: { userId } })
    if (!record) throw Object.assign(new Error('2FA nao iniciado'), { code: 'TFA_NOT_STARTED' })
    if (!authenticator.check(totp, record.secret)) {
      throw Object.assign(new Error('TOTP invalido'), { code: 'TFA_INVALID' })
    }
    const plainCodes: string[] = Array.from({ length: BACKUP_CODE_COUNT }, () => generateBackupCode())
    const hashed = plainCodes.map(hashCode)
    await prisma.adminTwoFactor.update({
      where: { userId },
      data: { enrolledAt: new Date(), backupCodesHash: hashed, lastUsedStep: BigInt(Math.floor(Date.now() / 1000 / TOTP_STEP)) },
    })
    await prisma.auditLog.create({ data: { userId, action: '2fa_enrolled', entityType: 'AdminTwoFactor' } })
    return { backupCodes: plainCodes }
  }

  /**
   * Valida TOTP ou backup code. Rate-limit via abuseService.
   * Protege replay — TOTP com step igual ao ultimo usado e rejeitado.
   */
  async verify(userId: string, token: string): Promise<{ ok: true }> {
    await abuseService.checkRate?.(`2fa:${userId}`, 5, 15 * 60)
    const record = await prisma.adminTwoFactor.findUnique({ where: { userId } })
    if (!record || !record.enrolledAt) throw Object.assign(new Error('2FA nao enrolled'), { code: 'TFA_NOT_ENROLLED' })

    // 1. TOTP
    if (authenticator.check(token, record.secret)) {
      const currentStep = BigInt(Math.floor(Date.now() / 1000 / TOTP_STEP))
      if (record.lastUsedStep && record.lastUsedStep >= currentStep) {
        throw Object.assign(new Error('TOTP reutilizado'), { code: 'TFA_REUSED' })
      }
      await prisma.adminTwoFactor.update({ where: { userId }, data: { lastUsedStep: currentStep } })
      await prisma.auditLog.create({ data: { userId, action: '2fa_verified', entityType: 'AdminTwoFactor' } })
      return { ok: true }
    }

    // 2. Backup code
    const idx = record.backupCodesHash.findIndex((h) => verifyCodeHash(token, h))
    if (idx >= 0) {
      const newHashes = [...record.backupCodesHash.slice(0, idx), ...record.backupCodesHash.slice(idx + 1)]
      await prisma.adminTwoFactor.update({ where: { userId }, data: { backupCodesHash: newHashes } })
      await prisma.auditLog.create({ data: { userId, action: 'backup_code_used', entityType: 'AdminTwoFactor' } })
      return { ok: true }
    }

    await prisma.auditLog.create({ data: { userId, action: '2fa_failed', entityType: 'AdminTwoFactor' } })
    throw Object.assign(new Error('Token invalido'), { code: 'TFA_INVALID' })
  }

  async regenerateBackupCodes(userId: string, currentTotp: string): Promise<string[]> {
    const record = await prisma.adminTwoFactor.findUnique({ where: { userId } })
    if (!record || !record.enrolledAt) throw Object.assign(new Error('2FA nao enrolled'), { code: 'TFA_NOT_ENROLLED' })
    if (!authenticator.check(currentTotp, record.secret)) {
      throw Object.assign(new Error('TOTP invalido'), { code: 'TFA_INVALID' })
    }
    const plainCodes: string[] = Array.from({ length: BACKUP_CODE_COUNT }, () => generateBackupCode())
    await prisma.adminTwoFactor.update({ where: { userId }, data: { backupCodesHash: plainCodes.map(hashCode) } })
    await prisma.auditLog.create({ data: { userId, action: '2fa_backup_regen', entityType: 'AdminTwoFactor' } })
    return plainCodes
  }

  async resetFor(targetUserId: string, actorAdminId: string, justification: string): Promise<void> {
    if (!justification || justification.length < 10) {
      throw Object.assign(new Error('Justificativa obrigatoria (>= 10 chars)'), { code: 'VAL_001' })
    }
    await prisma.adminTwoFactor.deleteMany({ where: { userId: targetUserId } })
    await prisma.auditLog.create({
      data: {
        userId: actorAdminId,
        action: '2fa_reset',
        entityType: 'AdminTwoFactor',
        entityId: targetUserId,
        metadata: { targetUserId, justification },
      },
    })
  }

  async isEnrolled(userId: string): Promise<boolean> {
    const r = await prisma.adminTwoFactor.findUnique({ where: { userId }, select: { enrolledAt: true } })
    return !!r?.enrolledAt
  }
}

export const adminTwoFactorService = new AdminTwoFactorService()
