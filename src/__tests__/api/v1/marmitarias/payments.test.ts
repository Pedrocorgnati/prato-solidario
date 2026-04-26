/**
 * Testes unitários — GET /api/v1/marmitarias/payments
 * @see module-14-painel-marmitaria/TASK-3/ST004
 *
 * Cenários:
 *   (a) paginação correta (20 itens por página)
 *   (b) filtro por período (from/to)
 *   (c) export CSV com todos os itens (sem paginação, max 10.000)
 *   (d) truncamento em 10.000 registros com header X-Truncated
 *   (e) ausência de PII no response (sponsorId, guestEmail não expostos)
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
    findPayments: vi.fn(),
    isActive: vi.fn(),
    getStatusErrorCode: vi.fn(),
  },
}))

import { requireRole } from '@/lib/auth/session'
import { marmitariaRepository } from '@/repositories/marmitaria.repository'
import { GET } from '@/app/api/v1/marmitarias/payments/route'

const mockUser = { id: 'user-001', role: 'MARMITARIA', name: 'Chef', email: 'chef@test.com' }
const mockProfile = {
  id: 'marm-001',
  userId: 'user-001',
  status: 'ACTIVE',
  balance: null,
  mpConnection: null,
}

// Item de pagamento mock — sem PII
const mockPaymentItem = {
  id: 'purchase-001',
  createdAt: new Date('2026-04-01T10:00:00Z'),
  totalAmount: '150.00',
  paymentStatus: 'APPROVED',
  mpPaymentId: 'MP-001',
  quantity: 3,
}

const makeRequest = (params: Record<string, string> = {}) => {
  const url = new URL('http://localhost/api/v1/marmitarias/payments')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url)
}

describe('GET /api/v1/marmitarias/payments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireRole).mockResolvedValue(mockUser as never)
    vi.mocked(marmitariaRepository.findProfileByUserId).mockResolvedValue(mockProfile as never)
    vi.mocked(marmitariaRepository.isActive).mockReturnValue(true)
  })

  it('(a) retorna paginação correta', async () => {
    vi.mocked(marmitariaRepository.findPayments).mockResolvedValue({
      items: [mockPaymentItem],
      total: 1,
      page: 1,
      pageSize: 20,
      truncated: false,
    } as never)

    const response = await GET(makeRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(data.total).toBe(1)
    expect(data.page).toBe(1)
    expect(data.pageSize).toBe(20)
  })

  it('(b) aplica filtro por período (from/to)', async () => {
    vi.mocked(marmitariaRepository.findPayments).mockResolvedValue({
      items: [mockPaymentItem],
      total: 1,
      page: 1,
      pageSize: 20,
      truncated: false,
    } as never)

    const response = await GET(
      makeRequest({
        from: '2026-04-01T00:00:00.000Z',
        to: '2026-04-30T23:59:59.000Z',
      })
    )

    expect(response.status).toBe(200)
    // Verificar que findPayments foi chamado com os filtros corretos
    expect(marmitariaRepository.findPayments).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.any(Date),
        to: expect.any(Date),
      })
    )
  })

  it('(c) gera CSV com todos os itens (export=true)', async () => {
    vi.mocked(marmitariaRepository.findPayments).mockResolvedValue({
      items: Array(50).fill(mockPaymentItem),
      total: 50,
      truncated: false,
    } as never)

    const response = await GET(makeRequest({ export: 'true' }))

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/csv')
    expect(response.headers.get('Content-Disposition')).toContain('.csv')

    const text = await response.text()
    // Deve ter cabeçalho + 50 linhas de dados
    const lines = text.trim().split('\n')
    expect(lines[0]).toBe('ID,Data,Valor (R$),Status,ID Transação MP,Marmitas')
    expect(lines).toHaveLength(51) // 1 header + 50 items
  })

  it('(d) CSV com X-Truncated quando total > 10.000', async () => {
    vi.mocked(marmitariaRepository.findPayments).mockResolvedValue({
      items: Array(10000).fill(mockPaymentItem),
      total: 15000,
      truncated: true,
    } as never)

    const response = await GET(makeRequest({ export: 'true' }))

    expect(response.status).toBe(200)
    expect(response.headers.get('X-Truncated')).toBe('true')
    expect(response.headers.get('X-Total-Records')).toBe('15000')
  })

  it('(e) response JSON não expõe PII do patrocinador', async () => {
    const itemWithSensitiveData = {
      ...mockPaymentItem,
      sponsorId: 'sponsor-001',    // deve ser omitido
      guestEmail: 'test@test.com', // deve ser omitido
      sponsor: { cpf: '123.456.789-00' }, // deve ser omitido
    }

    vi.mocked(marmitariaRepository.findPayments).mockResolvedValue({
      items: [itemWithSensitiveData],
      total: 1,
      page: 1,
      pageSize: 20,
      truncated: false,
    } as never)

    const response = await GET(makeRequest())
    const data = await response.json()

    expect(data.data[0]).not.toHaveProperty('sponsorId')
    expect(data.data[0]).not.toHaveProperty('guestEmail')
    expect(data.data[0]).not.toHaveProperty('sponsor')
    // Campos esperados
    expect(data.data[0]).toHaveProperty('id')
    expect(data.data[0]).toHaveProperty('amount')
    expect(data.data[0]).toHaveProperty('status')
  })
})
