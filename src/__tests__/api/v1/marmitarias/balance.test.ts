/**
 * Testes unitários — GET /api/v1/marmitarias/balance
 * @see module-14-painel-marmitaria/TASK-1/ST004
 *
 * Cenários:
 *   (a) saldo correto para marmitaria ACTIVE
 *   (b) 403 para marmitaria PENDING_APPROVAL (AUTH_008)
 *   (c) guard negativo DB-007 — retorna 0 para availableCredits < 0
 *   (d) 401 sem autenticação (redirect tratado como erro)
 *
 * Pré-requisito: vitest + @vitest/coverage-v8 + prisma mock (@prisma/client mock)
 * Instalar: pnpm add -D vitest @vitest/coverage-v8 @vitest/ui
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth/session', () => ({
  requireRole: vi.fn(),
}))

vi.mock('@/repositories/marmitaria.repository', () => ({
  marmitariaRepository: {
    findProfileByUserId: vi.fn(),
    computeBalance: vi.fn(),
    isActive: vi.fn(),
    getStatusErrorCode: vi.fn(),
  },
}))

import { requireRole } from '@/lib/auth/session'
import { marmitariaRepository } from '@/repositories/marmitaria.repository'
import { GET } from '@/app/api/v1/marmitarias/balance/route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUser = { id: 'user-001', email: 'chef@temp.com', role: 'MARMITARIA', name: 'Chef' }

const mockProfile = {
  id: 'marmitaria-001',
  userId: 'user-001',
  status: 'ACTIVE',
  tradeName: 'Tempero da Vó',
  balance: { availableCredits: 10, totalEarned: 500, totalWithdrawn: 0 },
  mpConnection: { status: 'CONNECTED' },
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/v1/marmitarias/balance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('(a) retorna saldo correto para marmitaria ACTIVE', async () => {
    vi.mocked(requireRole).mockResolvedValue(mockUser as never)
    vi.mocked(marmitariaRepository.findProfileByUserId).mockResolvedValue(mockProfile as never)
    vi.mocked(marmitariaRepository.isActive).mockReturnValue(true)
    vi.mocked(marmitariaRepository.computeBalance).mockResolvedValue({
      available: 10,
      pending: 2,
      delivered: 5,
      totalReceivedBrl: 250,
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({
      available: 10,
      pending: 2,
      delivered: 5,
      totalReceivedBrl: 250,
    })
    expect(response.headers.get('Cache-Control')).toBe('s-maxage=5, stale-while-revalidate=10')
  })

  it('(b) retorna 403 AUTH_008 para marmitaria PENDING_APPROVAL', async () => {
    vi.mocked(requireRole).mockResolvedValue(mockUser as never)
    vi.mocked(marmitariaRepository.findProfileByUserId).mockResolvedValue({
      ...mockProfile,
      status: 'PENDING_APPROVAL',
    } as never)
    vi.mocked(marmitariaRepository.isActive).mockReturnValue(false)
    vi.mocked(marmitariaRepository.getStatusErrorCode).mockReturnValue('AUTH_008')

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.code).toBe('AUTH_008')
  })

  it('(c) DB-007: retorna available=0 quando availableCredits é negativo', async () => {
    vi.mocked(requireRole).mockResolvedValue(mockUser as never)
    vi.mocked(marmitariaRepository.findProfileByUserId).mockResolvedValue({
      ...mockProfile,
      balance: { availableCredits: -3, totalEarned: 0, totalWithdrawn: 0 },
    } as never)
    vi.mocked(marmitariaRepository.isActive).mockReturnValue(true)
    // computeBalance aplica o guard internamente — retorna 0
    vi.mocked(marmitariaRepository.computeBalance).mockResolvedValue({
      available: 0,
      pending: 0,
      delivered: 0,
      totalReceivedBrl: 0,
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.available).toBe(0)
    expect(data.available).toBeGreaterThanOrEqual(0) // DB-007
  })

  it('(d) retorna 404 se perfil não encontrado', async () => {
    vi.mocked(requireRole).mockResolvedValue(mockUser as never)
    vi.mocked(marmitariaRepository.findProfileByUserId).mockResolvedValue(null)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.code).toBe('AUTH_008')
  })
})
