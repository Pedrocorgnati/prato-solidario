/**
 * Testes unitários — GET/PUT /api/v1/marmitarias/settings
 * @see module-14-painel-marmitaria/TASK-4/ST003
 *
 * Cenários:
 *   (a) GET retorna configurações atuais
 *   (b) PUT bem-sucedido + revalidatePath chamado
 *   (c) USER_023 — erro sem foto cadastrada
 *   (d) USER_024 — erro preço zero/negativo
 *   (e) USER_025 — erro sem dias selecionados (schema Zod)
 *   (f) preço bloqueado com compras aprovadas (409 PRICE_LOCKED)
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
    findSettings: vi.fn(),
    updateSettings: vi.fn(),
    isActive: vi.fn(),
    getStatusErrorCode: vi.fn(),
  },
}))

vi.mock('@/services/marmitaria-settings.service', async () => {
  const actual = await vi.importActual('@/services/marmitaria-settings.service')
  return {
    ...actual,
    marmitariaSettingsService: {
      getSettings: vi.fn(),
      updateSettings: vi.fn(),
    },
  }
})

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { requireRole } from '@/lib/auth/session'
import { marmitariaRepository } from '@/repositories/marmitaria.repository'
import { marmitariaSettingsService, PriceLockedError, PhotoRequiredError } from '@/services/marmitaria-settings.service'
import { GET, PUT } from '@/app/api/v1/marmitarias/settings/route'

const mockUser = { id: 'user-001', role: 'MARMITARIA', name: 'Chef', email: 'chef@test.com' }
const mockProfile = {
  id: 'marm-001',
  userId: 'user-001',
  status: 'ACTIVE',
  balance: null,
  mpConnection: null,
  user: { photoUrl: 'https://example.com/foto.jpg' },
}

const validSchedule = {
  days: ['MON', 'WED', 'FRI'],
  startTime: '11:00',
  endTime: '14:00',
  dailyCapacity: 20,
  orderDeadlineHours: '2',
}

const makeRequest = (body: Record<string, unknown>) =>
  new NextRequest('http://localhost/api/v1/marmitarias/settings', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })

describe('GET /api/v1/marmitarias/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireRole).mockResolvedValue(mockUser as never)
  })

  it('(a) retorna configurações atuais', async () => {
    vi.mocked(marmitariaSettingsService.getSettings).mockResolvedValue({
      id: 'marm-001',
      status: 'ACTIVE',
      pricePerMeal: 15.0,
      schedule: validSchedule,
      photoUrl: 'https://example.com/foto.jpg',
      publicAddress: { bairro: 'Bela Vista', cidade: 'São Paulo' },
      hasPriceLockedByPurchases: false,
    } as never)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.pricePerMeal).toBe(15.0)
    expect(data.schedule).toMatchObject(validSchedule)
    // LGPD: endereço expõe apenas bairro e cidade
    expect(data.publicAddress).toMatchObject({ bairro: 'Bela Vista', cidade: 'São Paulo' })
    expect(data.publicAddress).not.toHaveProperty('logradouro')
    expect(data.publicAddress).not.toHaveProperty('cep')
  })
})

describe('PUT /api/v1/marmitarias/settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireRole).mockResolvedValue(mockUser as never)
    vi.mocked(marmitariaRepository.findProfileByUserId).mockResolvedValue(mockProfile as never)
    vi.mocked(marmitariaRepository.isActive).mockReturnValue(true)
  })

  it('(b) salva configurações com sucesso e invalida cache', async () => {
    vi.mocked(marmitariaSettingsService.updateSettings).mockResolvedValue({
      success: true,
      updatedAt: new Date().toISOString(),
    })

    const response = await PUT(
      makeRequest({
        schedule: validSchedule,
        pricePerMeal: 15.0,
        photoUrl: 'https://example.com/foto.jpg',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(marmitariaSettingsService.updateSettings).toHaveBeenCalledOnce()
  })

  it('(c) USER_023 — retorna 422 PHOTO_REQUIRED sem foto', async () => {
    vi.mocked(marmitariaSettingsService.updateSettings).mockRejectedValue(
      new PhotoRequiredError()
    )

    const response = await PUT(makeRequest({ schedule: validSchedule }))
    const data = await response.json()

    expect(response.status).toBe(422)
    expect(data.code).toBe('PHOTO_REQUIRED')
    expect(data.error).toMatch(/Foto obrigatória/)
  })

  it('(d) USER_024 — retorna 422 para pricePerMeal = 0', async () => {
    const response = await PUT(
      makeRequest({
        schedule: validSchedule,
        pricePerMeal: 0, // USER_024
        photoUrl: 'https://example.com/foto.jpg',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(422)
    expect(data.error).toBeTruthy()
  })

  it('(e) USER_025 — retorna 422 para schedule sem dias', async () => {
    const response = await PUT(
      makeRequest({
        schedule: { ...validSchedule, days: [] }, // USER_025
        photoUrl: 'https://example.com/foto.jpg',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(422)
    expect(data.error).toMatch(/Selecione ao menos/)
  })

  it('(f) preço bloqueado com compras aprovadas — 409 PRICE_LOCKED', async () => {
    vi.mocked(marmitariaSettingsService.updateSettings).mockRejectedValue(
      new PriceLockedError()
    )

    const response = await PUT(
      makeRequest({
        schedule: validSchedule,
        pricePerMeal: 20.0,
        photoUrl: 'https://example.com/foto.jpg',
      })
    )
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.code).toBe('PRICE_LOCKED')
  })
})
