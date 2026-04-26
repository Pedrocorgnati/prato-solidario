/**
 * Testes unitários de AbuseService — progressão de bloqueio e verificação de estado.
 * AbuseService é o equivalente ao BlockLevelService descrito em TASK-15/ST002.
 * A lógica de bloqueio está em recordAbuse (progressão 1d → 3d → 7d → exponencial)
 * e em checkAbuse (verifica se existe blockedUntil > agora).
 * @see src/services/abuse.service.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    abuseRecord: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      count: vi.fn(),
    },
    adminAlert: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/utils/date', () => ({
  addDays: (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000),
}))

import { AbuseService } from '@/services/abuse.service'
import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeService() {
  return new AbuseService()
}

// ---------------------------------------------------------------------------
// getBlockDuration (via recordAbuse) — progressao de bloqueio
// ---------------------------------------------------------------------------

describe('AbuseService — progressão de bloqueio (recordAbuse)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.abuseRecord.create).mockResolvedValue({} as any)
    vi.mocked(prisma.abuseRecord.update).mockResolvedValue({} as any)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)
    vi.mocked(prisma.auditLog.count).mockResolvedValue(0)
    vi.mocked(prisma.adminAlert.findFirst).mockResolvedValue(null)
  })

  it('1ª ausência → bloqueio de 1 dia', async () => {
    vi.mocked(prisma.abuseRecord.findFirst).mockResolvedValue(null)

    const service = makeService()
    const result = await service.recordAbuse('1.2.3.4', null, 'no_show')

    expect(result.durationDays).toBe(1)
    const oneDay = 1 * 24 * 60 * 60 * 1000
    const diff = result.blockedUntil.getTime() - Date.now()
    expect(diff).toBeGreaterThan(oneDay - 5000)
    expect(diff).toBeLessThanOrEqual(oneDay + 5000)
  })

  it('2ª ausência → bloqueio de 3 dias', async () => {
    vi.mocked(prisma.abuseRecord.findFirst).mockResolvedValue({
      id: 'r1',
      blockCount: 1,
      createdAt: new Date(),
    } as any)

    const service = makeService()
    const result = await service.recordAbuse('1.2.3.4', null, 'no_show')

    expect(result.durationDays).toBe(3)
  })

  it('3ª+ ausência → progressão crescente', async () => {
    // Simula 3ª ocorrência
    vi.mocked(prisma.abuseRecord.findFirst).mockResolvedValue({
      id: 'r1',
      blockCount: 2,
      createdAt: new Date(),
    } as any)

    const service = makeService()
    const result3 = await service.recordAbuse('1.2.3.4', null, 'no_show')

    // Simula 4ª ocorrência
    vi.mocked(prisma.abuseRecord.findFirst).mockResolvedValue({
      id: 'r1',
      blockCount: 3,
      createdAt: new Date(),
    } as any)
    const result4 = await service.recordAbuse('1.2.3.5', null, 'no_show')

    expect(result4.durationDays).toBeGreaterThanOrEqual(result3.durationDays)
  })

  it('escalamento exponencial a partir da 4ª ausência (7 * 2^(n-3))', async () => {
    // 4ª ocorrência: blockCount=3 → durationDays = 7 * 2^(4-3) = 14
    vi.mocked(prisma.abuseRecord.findFirst).mockResolvedValue({
      id: 'r1',
      blockCount: 3,
      createdAt: new Date(),
    } as any)

    const service = makeService()
    const result = await service.recordAbuse('1.2.3.4', null, 'no_show')

    // 4ª ausência: 7 * 2^(4-3) = 14 dias
    expect(result.durationDays).toBe(14)
    // Garante que é maior que a 3ª ausência (7 dias)
    expect(result.durationDays).toBeGreaterThan(7)
  })

  it('isRedistributor=true → isento de bloqueio (durationDays = 0)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      isRedistributor: true,
    } as any)

    const service = makeService()
    const result = await service.recordAbuse('1.2.3.4', null, 'no_show', 'u1')

    expect(result.durationDays).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// isBlocked (via checkAbuse)
// ---------------------------------------------------------------------------

describe('AbuseService — checkAbuse (isBlocked)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
  })

  it('retorna blocked=false quando não há registro com blockedUntil no futuro', async () => {
    vi.mocked(prisma.abuseRecord.findFirst).mockResolvedValue(null)

    const service = makeService()
    const result = await service.checkAbuse('1.2.3.4', null)

    expect(result.blocked).toBe(false)
  })

  it('retorna blocked=true quando blockedUntil está no futuro', async () => {
    const future = new Date(Date.now() + 1000 * 60 * 60)
    vi.mocked(prisma.abuseRecord.findFirst).mockResolvedValue({
      id: 'r1',
      ipAddress: '1.2.3.4',
      blockedUntil: future,
    } as any)

    const service = makeService()
    const result = await service.checkAbuse('1.2.3.4', null)

    expect(result.blocked).toBe(true)
    expect(result.unblockedAt).toEqual(future)
  })

  it('retorna blocked=false quando isRedistributor=true (ONG isenta)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u1',
      isRedistributor: true,
    } as any)

    const service = makeService()
    const result = await service.checkAbuse('1.2.3.4', null, 'u1')

    expect(result.blocked).toBe(false)
    expect(result.reason).toBe('ONG_EXEMPT')
    // Não deve consultar abuseRecord
    expect(prisma.abuseRecord.findFirst).not.toHaveBeenCalled()
  })
})
