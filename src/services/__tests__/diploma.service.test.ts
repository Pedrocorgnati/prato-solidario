/**
 * Testes básicos para DiplomaService.
 * @see intake-review/TASK-17/ST004
 */

import { DiplomaService } from '../diploma.service'
import { calcKgFoodSaved, calcKgCO2Avoided, KG_PER_MEAL, CO2_FACTOR_IPCC } from '@/lib/constants/impact'

// Mock de dependências externas
jest.mock('@/lib/prisma', () => ({
  prisma: {
    diploma: {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    retrievalCode: { count: jest.fn() },
    $queryRaw: jest.fn(),
  },
}))

jest.mock('@/lib/storage', () => ({
  BUCKETS: { DIPLOMAS: 'diplomas' },
  getSignedUrl: jest.fn().mockResolvedValue('https://storage.example.com/diploma.pdf'),
}))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
      }),
    },
  }),
}))

jest.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-key',
  },
}))

// Importar depois dos mocks
import { prisma } from '@/lib/prisma'

describe('DiplomaService', () => {
  let service: DiplomaService

  beforeEach(() => {
    service = new DiplomaService()
    jest.clearAllMocks()
  })

  describe('generateDiploma', () => {
    it('deve retornar URL existente com dados ambientais calculados', async () => {
      // Simular diploma existente e não expirado
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10)
      ;(prisma.diploma.findUnique as jest.Mock).mockResolvedValue({
        id: 'diploma-1',
        userId: 'user-1',
        year: 2024,
        signedUrl: 'https://storage.example.com/diploma.pdf',
        signedUntil: futureDate,
        storageUrl: 'user-1/2024/diploma.pdf',
      })

      // Simular yearlyMeals
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ total: BigInt(50) }])

      const result = await service.generateDiploma('user-1', 2024)

      expect(result.url).toBe('https://storage.example.com/diploma.pdf')
      expect(result.totalMeals).toBe(50)
      expect(result.kgFoodSaved).toBe(calcKgFoodSaved(50))
      expect(result.kgCO2Avoided).toBe(calcKgCO2Avoided(50))
    })

    it('deve lançar DiplomaNotFoundError se usuário não tem doações', async () => {
      ;(prisma.diploma.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.retrievalCode.count as jest.Mock).mockResolvedValue(0)

      await expect(service.generateDiploma('user-no-donations', 2024)).rejects.toThrow(
        'Nenhuma doação registrada em 2024',
      )
    })
  })

  describe('calcKgFoodSaved e calcKgCO2Avoided', () => {
    it('calcula kg de alimento salvo corretamente', () => {
      expect(calcKgFoodSaved(100)).toBe(100 * KG_PER_MEAL)
      expect(calcKgFoodSaved(0)).toBe(0)
      expect(calcKgFoodSaved(1)).toBe(KG_PER_MEAL)
    })

    it('calcula CO2 evitado corretamente', () => {
      expect(calcKgCO2Avoided(100)).toBe(Math.round(100 * KG_PER_MEAL * CO2_FACTOR_IPCC * 100) / 100)
      expect(calcKgCO2Avoided(0)).toBe(0)
    })
  })
})
