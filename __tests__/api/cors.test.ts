/**
 * CORS unit tests — intake-review TASK-1/ST005
 * Valida whitelist, wildcard e build de headers.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isAllowedOrigin, buildCorsHeaders, getAllowedOrigins } from '@/lib/cors'

describe('isAllowedOrigin', () => {
  const OLD = process.env.ALLOWED_ORIGINS
  const OLD_NODE_ENV = process.env.NODE_ENV

  beforeEach(() => {
    process.env.ALLOWED_ORIGINS =
      'https://prato-solidario.app,https://*.vercel.app,http://localhost:3000'
  })

  afterEach(() => {
    process.env.ALLOWED_ORIGINS = OLD
    ;(process.env as Record<string, string | undefined>).NODE_ENV = OLD_NODE_ENV
  })

  it('rejects unlisted origins', () => {
    expect(isAllowedOrigin('https://evil.com')).toBe(false)
  })

  it('rejects null / empty', () => {
    expect(isAllowedOrigin(null)).toBe(false)
    expect(isAllowedOrigin('')).toBe(false)
    expect(isAllowedOrigin(undefined)).toBe(false)
  })

  it('accepts exact match', () => {
    expect(isAllowedOrigin('https://prato-solidario.app')).toBe(true)
  })

  it('accepts wildcard preview subdomain', () => {
    expect(isAllowedOrigin('https://abc.vercel.app')).toBe(true)
    expect(isAllowedOrigin('https://feature-xyz-team.vercel.app')).toBe(true)
  })

  it('rejects wildcard base host (must be real subdomain)', () => {
    expect(isAllowedOrigin('https://vercel.app')).toBe(false)
  })

  it('rejects malformed origin', () => {
    expect(isAllowedOrigin('not-a-url')).toBe(false)
  })

  it('defaults to no origins in production when env unset', () => {
    delete process.env.ALLOWED_ORIGINS
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    expect(getAllowedOrigins()).toEqual([])
    expect(isAllowedOrigin('http://localhost:3000')).toBe(false)
  })

  it('defaults to localhost in dev when env unset', () => {
    delete process.env.ALLOWED_ORIGINS
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'development'
    expect(isAllowedOrigin('http://localhost:3000')).toBe(true)
  })
})

describe('buildCorsHeaders', () => {
  it('echoes origin in Allow-Origin and sets credentials + vary', () => {
    const headers = buildCorsHeaders('https://prato-solidario.app')
    expect(headers['Access-Control-Allow-Origin']).toBe('https://prato-solidario.app')
    expect(headers['Access-Control-Allow-Credentials']).toBe('true')
    expect(headers['Vary']).toBe('Origin')
    expect(headers['Access-Control-Allow-Methods']).toContain('POST')
  })
})
