/**
 * Block-status endpoint — TASK-7/ST003 (intake-review) CL-286.
 * Cobre os dois estados: sem bloqueio ativo e com bloqueio vigente.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/auth.service', () => ({
  authService: {
    getSessionFromToken: vi.fn(async () => ({ userId: 'user-1' })),
  },
}))

const findFirst = vi.fn()
vi.mock('@/lib/prisma', () => ({
  prisma: {
    abuseRecord: {
      findFirst: (...args: unknown[]) => findFirst(...args),
    },
  },
}))

import { GET } from '@/app/api/v1/users/me/block-status/route'

function makeRequest() {
  return new Request('http://localhost/api/v1/users/me/block-status', {
    headers: { authorization: 'Bearer test-token' },
  }) as unknown as Parameters<typeof GET>[0]
}

describe('GET /api/v1/users/me/block-status', () => {
  beforeEach(() => {
    findFirst.mockReset()
  })

  it('returns unblocked when no active block exists', async () => {
    findFirst.mockResolvedValueOnce(null)
    const res = await GET(makeRequest())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toEqual({ blocked: false })
  })

  it('returns block payload with until date when active', async () => {
    const until = new Date(Date.now() + 60 * 60 * 1000)
    findFirst.mockResolvedValueOnce({
      userId: 'user-1',
      blockedUntil: until,
      reason: 'no_show',
      blockCount: 2,
    })
    const res = await GET(makeRequest())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toMatchObject({
      blocked: true,
      reason: 'no_show',
      until: until.toISOString(),
      escalationStep: 2,
    })
  })
})
