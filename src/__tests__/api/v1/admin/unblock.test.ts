import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    abuseRecord: { updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}))

vi.mock('@/lib/auth/session', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/repositories/admin.repository', () => ({
  adminRepository: {
    createAdminActionWithAudit: vi.fn(),
  },
}))

import { POST } from '@/app/api/v1/admin/users/[id]/unblock/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/auth/session'

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/v1/admin/users/test-id/unblock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('POST /api/v1/admin/users/[id]/unblock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue({
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'ADMIN' as any,
      name: 'Admin',
    })
  })

  it('rejeita justificativa com menos de 20 chars — RN019', async () => {
    const res = await POST(makeRequest({ reason: 'curto' }) as any, { params: Promise.resolve({ id: 'user-1' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(JSON.stringify(body)).toContain('20')
  })

  it('rejeita ausência de justificativa', async () => {
    const res = await POST(makeRequest({}) as any, { params: Promise.resolve({ id: 'user-1' }) })
    expect(res.status).toBe(400)
  })

  it('desbloqueia usuário com justificativa válida (>=20 chars)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'user-1' } as any)
    vi.mocked(prisma.abuseRecord.updateMany).mockResolvedValueOnce({ count: 1 } as any)
    vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any)

    const reason = 'Revisão manual confirmou que bloqueio foi indevido'
    const res = await POST(makeRequest({ reason }) as any, { params: Promise.resolve({ id: 'user-1' }) })
    expect(res.status).toBe(200)
  })
})
