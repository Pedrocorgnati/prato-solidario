/**
 * Helpers de sessao 2FA (flag twoFactorVerified em cookie HMAC-signed).
 * @see intake-review/TASK-2/ST003-ST004 — CL-265
 */

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

const COOKIE = 'ps_admin_2fa'
const MAX_AGE_SEC = 60 * 60 * 8 // 8h

function sign(userId: string, expMs: number): string {
  const payload = `${userId}.${expMs}`
  const mac = createHmac('sha256', env.AUTH_SESSION_SECRET ?? env.DATABASE_URL ?? 'dev-secret-change-me')
    .update(payload)
    .digest('hex')
  return `${payload}.${mac}`
}

function verify(value: string): { userId: string; expMs: number } | null {
  const parts = value.split('.')
  if (parts.length !== 3) return null
  const [userId, expStr, mac] = parts
  const expected = createHmac('sha256', env.AUTH_SESSION_SECRET ?? env.DATABASE_URL ?? 'dev-secret-change-me')
    .update(`${userId}.${expStr}`)
    .digest('hex')
  const a = Buffer.from(mac, 'hex')
  const b = Buffer.from(expected, 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  const expMs = Number(expStr)
  if (!Number.isFinite(expMs) || Date.now() > expMs) return null
  return { userId, expMs }
}

export async function markTwoFactorVerified(userId: string) {
  const store = await cookies()
  const exp = Date.now() + MAX_AGE_SEC * 1000
  store.set({
    name: COOKIE,
    value: sign(userId, exp),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_SEC,
    path: '/',
  })
}

export async function isTwoFactorVerified(userId: string): Promise<boolean> {
  const store = await cookies()
  const c = store.get(COOKIE)?.value
  if (!c) return false
  const v = verify(c)
  return !!v && v.userId === userId
}

export async function clearTwoFactor() {
  const store = await cookies()
  store.delete(COOKIE)
}
