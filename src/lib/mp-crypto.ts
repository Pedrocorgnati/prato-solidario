/**
 * Criptografia AES-256-GCM para tokens MercadoPago Connect.
 * Formato: "iv:authTag:encrypted" em hex.
 * Nunca armazena plaintext — somente o formato criptografado.
 *
 * Variável de ambiente: MP_ENCRYPTION_KEY (64 chars hex = 32 bytes = 256-bit)
 */
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'crypto'
import { env } from './env'

const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  const key = env.MP_ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    throw new Error('MP_ENCRYPTION_KEY inválida ou ausente. Gere com: openssl rand -hex 32')
  }
  return Buffer.from(key, 'hex')
}

/**
 * Criptografa texto plano com AES-256-GCM.
 * @returns string no formato "iv:authTag:encrypted" (tudo em hex)
 */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12) // 96-bit IV para GCM
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':')
}

/**
 * Descriptografa string no formato "iv:authTag:encrypted".
 * @returns texto plano original
 * @throws se formato inválido ou autenticação falhar
 */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':')
  if (parts.length !== 3) {
    throw new Error('Formato de ciphertext inválido — esperado "iv:authTag:encrypted"')
  }

  const [ivHex, authTagHex, encryptedHex] = parts
  const key = getKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

/**
 * Compara dois buffers de forma segura contra timing attacks.
 * Equivalente ao `crypto.timingSafeEqual` mas para strings.
 */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
