/**
 * Rate limit unit tests — intake-review TASK-1/ST005
 * Valida sliding window, headers e key builder.
 */
import { describe, it, expect } from 'vitest'
import {
  rateLimit,
  rateLimitHeaders,
  buildRateLimitKey,
  getClientIp,
  getRouteLimit,
} from '@/lib/rate-limit'

describe('rateLimit (sliding window)', () => {
  it('allows until limit is reached then blocks', async () => {
    const key = `unit-test-${Date.now()}-${Math.random()}`
    for (let i = 0; i < 5; i++) {
      const r = await rateLimit({ key, limit: 5, windowMs: 1000 })
      expect(r.allowed).toBe(true)
      expect(r.remaining).toBe(5 - (i + 1))
    }
    const blocked = await rateLimit({ key, limit: 5, windowMs: 1000 })
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('resets after windowMs', async () => {
    const key = `unit-test-reset-${Date.now()}-${Math.random()}`
    await rateLimit({ key, limit: 1, windowMs: 50 })
    const blocked = await rateLimit({ key, limit: 1, windowMs: 50 })
    expect(blocked.allowed).toBe(false)
    await new Promise((r) => setTimeout(r, 80))
    const after = await rateLimit({ key, limit: 1, windowMs: 50 })
    expect(after.allowed).toBe(true)
  })

  it('independent keys do not share counters', async () => {
    const k1 = `k1-${Date.now()}-${Math.random()}`
    const k2 = `k2-${Date.now()}-${Math.random()}`
    for (let i = 0; i < 3; i++) await rateLimit({ key: k1, limit: 3, windowMs: 1000 })
    const r = await rateLimit({ key: k2, limit: 3, windowMs: 1000 })
    expect(r.allowed).toBe(true)
  })
})

describe('rateLimitHeaders', () => {
  it('emits X-RateLimit-Limit / Remaining / Reset', async () => {
    const key = `headers-${Date.now()}`
    const r = await rateLimit({ key, limit: 10, windowMs: 1000 })
    const h = rateLimitHeaders(r)
    expect(h['X-RateLimit-Limit']).toBe('10')
    expect(h['X-RateLimit-Remaining']).toBe('9')
    expect(h['X-RateLimit-Reset']).toMatch(/^\d+$/)
    expect(h['Retry-After']).toBeUndefined()
  })

  it('emits Retry-After when blocked', async () => {
    const key = `headers-blocked-${Date.now()}`
    await rateLimit({ key, limit: 1, windowMs: 1000 })
    const r = await rateLimit({ key, limit: 1, windowMs: 1000 })
    const h = rateLimitHeaders(r)
    expect(h['Retry-After']).toBeDefined()
  })
})

describe('buildRateLimitKey', () => {
  it('prefers userId when available', () => {
    expect(buildRateLimitKey('codes', { userId: 'u1', ip: '1.2.3.4' })).toBe('user:u1:codes')
  })
  it('falls back to ip otherwise', () => {
    expect(buildRateLimitKey('codes', { ip: '1.2.3.4' })).toBe('ip:1.2.3.4:codes')
  })
  it('falls back to unknown when neither', () => {
    expect(buildRateLimitKey('codes', {})).toBe('ip:unknown:codes')
  })
})

describe('getClientIp', () => {
  it('prefers x-forwarded-for first entry', () => {
    const h = new Headers()
    h.set('x-forwarded-for', '10.0.0.1, 1.2.3.4')
    expect(getClientIp(h)).toBe('10.0.0.1')
  })
  it('falls back to x-real-ip', () => {
    const h = new Headers()
    h.set('x-real-ip', '5.6.7.8')
    expect(getClientIp(h)).toBe('5.6.7.8')
  })
  it('returns unknown when nothing present', () => {
    expect(getClientIp(new Headers())).toBe('unknown')
  })
})

describe('getRouteLimit', () => {
  it('returns defaults when env unset', () => {
    const OLD = { ...process.env }
    delete process.env.RATE_LIMIT_AUTH
    delete process.env.RATE_LIMIT_CODES
    delete process.env.RATE_LIMIT_CONTACT
    delete process.env.RATE_LIMIT_DEFAULT
    try {
      expect(getRouteLimit('auth')).toBe(10)
      expect(getRouteLimit('codes')).toBe(20)
      expect(getRouteLimit('contact')).toBe(3)
      expect(getRouteLimit('default')).toBe(60)
    } finally {
      Object.assign(process.env, OLD)
    }
  })

  it('honors env overrides', () => {
    const OLD = process.env.RATE_LIMIT_AUTH
    process.env.RATE_LIMIT_AUTH = '42'
    try {
      expect(getRouteLimit('auth')).toBe(42)
    } finally {
      process.env.RATE_LIMIT_AUTH = OLD
    }
  })
})
