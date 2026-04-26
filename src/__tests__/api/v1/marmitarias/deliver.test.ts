/**
 * Testes unitários — POST /api/v1/marmitarias/meals/[id]/deliver
 * @see module-14-painel-marmitaria/TASK-2/ST003
 *
 * Cenários:
 *   (a) entrega bem-sucedida + balance atualizado
 *   (b) 403 ownership — meal de outra marmitaria
 *   (c) 409 already delivered — meal já DELIVERED
 *   (d) confirmação por código manual
 *   (e) rollback em falha de transação (DB-007 guard)
 *
 * Pré-requisito: vitest + @vitest/coverage-v8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/session', () => ({
  requireRole: vi.fn(),
}))

vi.mock('@/repositories/marmitaria.repository', () => ({
  marmitariaRepository: {
    findProfileByUserId: vi.fn(),
    findMealById: vi.fn(),
    findOldestReservedMeal: vi.fn(),
    confirmDelivery: vi.fn(),
    isActive: vi.fn(),
    getStatusErrorCode: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    retrievalCode: {
      findUnique: vi.fn(),
    },
  },
}))

import { requireRole } from '@/lib/auth/session'
import { marmitariaRepository } from '@/repositories/marmitaria.repository'
import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/v1/marmitarias/meals/[id]/deliver/route'

const mockUser = { id: 'user-001', role: 'MARMITARIA', name: 'Chef', email: 'chef@test.com' }
const mockProfile = {
  id: 'marm-001',
  userId: 'user-001',
  status: 'ACTIVE',
  tradeName: 'Tempero da Vó',
  balance: null,
  mpConnection: null,
}

const makeRequest = (body?: Record<string, unknown>) =>
  new NextRequest('http://localhost/api/v1/marmitarias/meals/meal-001/deliver', {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
  })

const makeParams = (id = 'meal-001') =>
  ({ params: Promise.resolve({ id }) } as { params: Promise<{ id: string }> })

describe('POST /api/v1/marmitarias/meals/[id]/deliver', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireRole).mockResolvedValue(mockUser as never)
    vi.mocked(marmitariaRepository.findProfileByUserId).mockResolvedValue(mockProfile as never)
  })

  it('(a) confirma entrega com sucesso e atualiza balance', async () => {
    vi.mocked(marmitariaRepository.findMealById).mockResolvedValue({
      id: 'meal-001',
      marmitariaId: 'marm-001',
      status: 'RESERVED',
      purchase: { quantity: 1 },
    } as never)
    vi.mocked(marmitariaRepository.confirmDelivery).mockResolvedValue({
      meal: { id: 'meal-001', status: 'DELIVERED' } as never,
      balanceUpdated: { available: 9, delivered: 1 },
    })

    const response = await POST(makeRequest(), makeParams())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.mealId).toBe('meal-001')
    expect(data.balanceUpdated.available).toBe(9)
  })

  it('(b) retorna 403 para ownership inválido', async () => {
    vi.mocked(marmitariaRepository.findMealById).mockResolvedValue({
      id: 'meal-001',
      marmitariaId: 'outra-marm', // ownership inválido
      status: 'RESERVED',
      purchase: { quantity: 1 },
    } as never)

    const response = await POST(makeRequest(), makeParams())
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.code).toBe('AUTH_011')
  })

  it('(c) retorna 409 para marmita já entregue', async () => {
    vi.mocked(marmitariaRepository.findMealById).mockResolvedValue({
      id: 'meal-001',
      marmitariaId: 'marm-001',
      status: 'DELIVERED', // já entregue
      purchase: { quantity: 1 },
    } as never)

    const response = await POST(makeRequest(), makeParams())
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toMatch(/já foi confirmada/)
  })

  it('(d) confirma entrega por código manual', async () => {
    vi.mocked(prisma.retrievalCode.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      code: 'D5I0042',
      status: 'ACTIVE',
      donation: { type: 'SPONSORED', status: 'RESERVED' },
    })
    vi.mocked(marmitariaRepository.findOldestReservedMeal).mockResolvedValue({
      id: 'meal-001',
      marmitariaId: 'marm-001',
      status: 'RESERVED',
    } as never)
    vi.mocked(marmitariaRepository.confirmDelivery).mockResolvedValue({
      meal: { id: 'meal-001', status: 'DELIVERED' } as never,
      balanceUpdated: { available: 9, delivered: 1 },
    })

    const response = await POST(makeRequest({ code: 'D5I0042' }), makeParams())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.confirmedByCode).toBe('D5I0042')
  })

  it('(e) retorna 500 em falha de transação (rollback simulado)', async () => {
    vi.mocked(marmitariaRepository.findMealById).mockResolvedValue({
      id: 'meal-001',
      marmitariaId: 'marm-001',
      status: 'RESERVED',
      purchase: { quantity: 1 },
    } as never)
    vi.mocked(marmitariaRepository.confirmDelivery).mockRejectedValue(
      new Error('Transaction failed')
    )

    const response = await POST(makeRequest(), makeParams())

    expect(response.status).toBe(500)
  })
})
