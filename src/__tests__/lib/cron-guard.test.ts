import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { validateCronRequest, cronUnauthorized } from '@/lib/cron-guard'

// Mock env
vi.mock('@/lib/env', () => ({
  env: { CRON_SECRET: 'a'.repeat(32) },
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}))

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/v1/internal/crons/test', {
    method: 'POST',
    headers,
  })
}

describe('validateCronRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aceita x-vercel-cron: 1 (Vercel nativo)', () => {
    const req = makeRequest({ 'x-vercel-cron': '1' })
    expect(validateCronRequest(req)).toBe(true)
  })

  it('aceita Bearer {CRON_SECRET} válido', () => {
    const req = makeRequest({ authorization: `Bearer ${'a'.repeat(32)}` })
    expect(validateCronRequest(req)).toBe(true)
  })

  it('rejeita sem header de autenticação', () => {
    const req = makeRequest()
    expect(validateCronRequest(req)).toBe(false)
  })

  it('rejeita Bearer token inválido', () => {
    const req = makeRequest({ authorization: 'Bearer wrong-token' })
    expect(validateCronRequest(req)).toBe(false)
  })

  it('rejeita x-vercel-cron com valor diferente de 1', () => {
    const req = makeRequest({ 'x-vercel-cron': '0' })
    expect(validateCronRequest(req)).toBe(false)
  })

  it('loga IP em tentativas inválidas', async () => {
    const { logger } = await import('@/lib/logger')
    const req = makeRequest({ 'x-forwarded-for': '192.168.1.1' })
    validateCronRequest(req)
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ ip: '192.168.1.1' }),
      expect.stringContaining('unauthorized')
    )
  })
})

describe('cronUnauthorized', () => {
  it('retorna 401 com error AUTH_001', async () => {
    const res = cronUnauthorized()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ ok: false, error: 'AUTH_001' })
  })
})
