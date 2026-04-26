/**
 * Testes unitários — GamificationService
 * @see module-20-gamificacao/TASK-1
 *
 * Cenários:
 *   (a) PRIMEIRA_DOACAO: >= 1 doação ever
 *   (b) DOADOR_FREQUENTE: >= 4 doações no mês
 *   (c) CENTURIAO: >= 100 refeições acumuladas
 *   (d) MESTRE: >= 500 refeições acumuladas
 *   (e) HEROI_DO_MES: top 3 do mês (via processMonthlyCycle)
 *   (f) Idempotência: badges existentes não duplicados
 *   (g) getBadgesWithProgress: earned + pending com progresso
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    badge: { upsert: vi.fn(), findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}))

vi.mock('@/repositories/gamification.repository', () => ({
  gamificationRepository: {
    getTotalDonationsEver: vi.fn(),
    getDonationCountForUserInMonth: vi.fn(),
    getCumulativeMealsByUser: vi.fn(),
    getTopDonorsMonth: vi.fn(),
    getActiveDonorIds: vi.fn(),
    hasUserBadge: vi.fn(),
    awardBadge: vi.fn(),
    getBadgesByUser: vi.fn(),
  },
}))

import { gamificationRepository } from '@/repositories/gamification.repository'
import { GamificationService, calculateHeroScore } from '@/services/gamification.service'

// BadgeType enum values (match @/types/enums)
const BadgeType = {
  PRIMEIRA_DOACAO: 'PRIMEIRA_DOACAO',
  DOADOR_FREQUENTE: 'DOADOR_FREQUENTE',
  HEROI_DO_MES: 'HEROI_DO_MES',
  CENTURIAO: 'CENTURIAO',
  MESTRE: 'MESTRE',
} as const

const mockRepo = gamificationRepository as {
  getTotalDonationsEver: ReturnType<typeof vi.fn>
  getDonationCountForUserInMonth: ReturnType<typeof vi.fn>
  getCumulativeMealsByUser: ReturnType<typeof vi.fn>
  getTopDonorsMonth: ReturnType<typeof vi.fn>
  getActiveDonorIds: ReturnType<typeof vi.fn>
  hasUserBadge: ReturnType<typeof vi.fn>
  awardBadge: ReturnType<typeof vi.fn>
  getBadgesByUser: ReturnType<typeof vi.fn>
}

describe('GamificationService', () => {
  let service: GamificationService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new GamificationService()
  })

  describe('calculateBadgesForUser', () => {
    it('deve conceder PRIMEIRA_DOACAO com >= 1 doação ever', async () => {
      mockRepo.getTotalDonationsEver.mockResolvedValueOnce(1)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(0)
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(0)

      const result = await service.calculateBadgesForUser('user-1', 3, 2026)

      expect(result).toContain(BadgeType.PRIMEIRA_DOACAO)
    })

    it('deve conceder DOADOR_FREQUENTE com >= 4 doações no mês', async () => {
      mockRepo.getTotalDonationsEver.mockResolvedValueOnce(10)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(4)
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(20)

      const result = await service.calculateBadgesForUser('user-1', 3, 2026)

      expect(result).toContain(BadgeType.DOADOR_FREQUENTE)
    })

    it('deve conceder badge no limiar exato (4 doações)', async () => {
      mockRepo.getTotalDonationsEver.mockResolvedValueOnce(4)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(4)
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(10)

      const result = await service.calculateBadgesForUser('user-1', 3, 2026)

      expect(result).toContain(BadgeType.DOADOR_FREQUENTE)
    })

    it('deve NÃO conceder DOADOR_FREQUENTE com < 4 doações no mês', async () => {
      mockRepo.getTotalDonationsEver.mockResolvedValueOnce(3)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(3)
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(10)

      const result = await service.calculateBadgesForUser('user-1', 3, 2026)

      expect(result).not.toContain(BadgeType.DOADOR_FREQUENTE)
    })

    it('deve conceder CENTURIAO com >= 100 refeições acumuladas', async () => {
      mockRepo.getTotalDonationsEver.mockResolvedValueOnce(50)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(5)
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(100)

      const result = await service.calculateBadgesForUser('user-1', 3, 2026)

      expect(result).toContain(BadgeType.CENTURIAO)
    })

    it('deve conceder MESTRE com >= 500 refeições acumuladas', async () => {
      mockRepo.getTotalDonationsEver.mockResolvedValueOnce(200)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(10)
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(500)

      const result = await service.calculateBadgesForUser('user-1', 3, 2026)

      expect(result).toContain(BadgeType.CENTURIAO)
      expect(result).toContain(BadgeType.MESTRE)
    })

    it('deve retornar array vazio quando nenhum critério atendido', async () => {
      mockRepo.getTotalDonationsEver.mockResolvedValueOnce(0)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(0)
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(0)

      const result = await service.calculateBadgesForUser('user-1', 3, 2026)

      expect(result).toEqual([])
    })

    it('deve conceder múltiplos badges simultaneamente', async () => {
      mockRepo.getTotalDonationsEver.mockResolvedValueOnce(50)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(6)
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(150)

      const result = await service.calculateBadgesForUser('user-1', 3, 2026)

      expect(result).toContain(BadgeType.PRIMEIRA_DOACAO)
      expect(result).toContain(BadgeType.DOADOR_FREQUENTE)
      expect(result).toContain(BadgeType.CENTURIAO)
      expect(result).not.toContain(BadgeType.MESTRE)
    })
  })

  describe('processMonthlyCycle', () => {
    it('deve processar todos os doadores ativos e conceder badges', async () => {
      mockRepo.getActiveDonorIds.mockResolvedValueOnce(['user-1', 'user-2'])
      mockRepo.getTopDonorsMonth.mockResolvedValueOnce([
        { userId: 'user-1', totalMeals: 50, rank: 1 },
      ])

      // user-1: primeira doação + heroi do mês
      mockRepo.getTotalDonationsEver.mockResolvedValueOnce(5)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(2)
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(50)
      mockRepo.hasUserBadge.mockResolvedValue(false)
      mockRepo.awardBadge.mockResolvedValue({ id: 'badge-1' })

      // user-2: primeira doação apenas
      mockRepo.getTotalDonationsEver.mockResolvedValueOnce(1)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(1)
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(3)

      const result = await service.processMonthlyCycle(3, 2026)

      expect(result.processed).toBe(2)
      expect(result.badgesAwarded).toBeGreaterThan(0)
      expect(result.errors).toHaveLength(0)
    })

    it('deve ser idempotente — não duplicar badges existentes', async () => {
      mockRepo.getActiveDonorIds.mockResolvedValueOnce(['user-1'])
      mockRepo.getTopDonorsMonth.mockResolvedValueOnce([])

      mockRepo.getTotalDonationsEver.mockResolvedValueOnce(5)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(2)
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(10)
      // Badge já existe
      mockRepo.hasUserBadge.mockResolvedValue(true)

      const result = await service.processMonthlyCycle(3, 2026)

      expect(result.processed).toBe(1)
      expect(result.badgesAwarded).toBe(0)
      expect(mockRepo.awardBadge).not.toHaveBeenCalled()
    })

    it('deve continuar processando se um usuário falhar', async () => {
      mockRepo.getActiveDonorIds.mockResolvedValueOnce(['user-fail', 'user-ok'])
      mockRepo.getTopDonorsMonth.mockResolvedValueOnce([])

      // user-fail: erro
      mockRepo.getTotalDonationsEver.mockRejectedValueOnce(new Error('DB error'))

      // user-ok: sucesso
      mockRepo.getTotalDonationsEver.mockResolvedValueOnce(1)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(0)
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(0)
      mockRepo.hasUserBadge.mockResolvedValue(false)
      mockRepo.awardBadge.mockResolvedValue({ id: 'badge-1' })

      const result = await service.processMonthlyCycle(3, 2026)

      expect(result.processed).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('user-fail')
    })

    it('deve conceder HEROI_DO_MES para usuários no top 3', async () => {
      mockRepo.getActiveDonorIds.mockResolvedValueOnce(['user-hero'])
      mockRepo.getTopDonorsMonth.mockResolvedValueOnce([
        { userId: 'user-hero', totalMeals: 100, rank: 1 },
      ])

      mockRepo.getTotalDonationsEver.mockResolvedValueOnce(20)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(5)
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(100)
      mockRepo.hasUserBadge.mockResolvedValue(false)
      mockRepo.awardBadge.mockResolvedValue({ id: 'badge-1' })

      await service.processMonthlyCycle(3, 2026)

      const awardCalls = mockRepo.awardBadge.mock.calls
      const heroCall = awardCalls.find(
        (call: unknown[]) => call[1] === BadgeType.HEROI_DO_MES,
      )
      expect(heroCall).toBeDefined()
    })

    it('deve retornar 0 processados quando não há doadores', async () => {
      mockRepo.getActiveDonorIds.mockResolvedValueOnce([])
      mockRepo.getTopDonorsMonth.mockResolvedValueOnce([])

      const result = await service.processMonthlyCycle(3, 2026)

      expect(result.processed).toBe(0)
      expect(result.badgesAwarded).toBe(0)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('calculateHeroScore — fórmula 60/40', () => {
    it('peso correto: volume 60%, consistência 40%', () => {
      const score = calculateHeroScore({ volume: 100, consistency: 0.5, userId: 'u1' })
      expect(score).toBeCloseTo(100 * 0.6 + 0.5 * 100 * 0.4) // 60 + 20 = 80
    })

    it('consistência perfeita vale menos que volume alto', () => {
      const altaConsistencia = calculateHeroScore({ volume: 10, consistency: 1.0, userId: 'u1' })
      const altoVolume = calculateHeroScore({ volume: 100, consistency: 0.0, userId: 'u1' })
      expect(altoVolume).toBeGreaterThan(altaConsistencia)
    })

    it('score zero quando volume e consistência são zero', () => {
      const score = calculateHeroScore({ volume: 0, consistency: 0, userId: 'u1' })
      expect(score).toBe(0)
    })

    it('score máximo com volume 100 e consistência 1.0', () => {
      const score = calculateHeroScore({ volume: 100, consistency: 1.0, userId: 'u1' })
      expect(score).toBeCloseTo(100) // 60 + 40 = 100
    })
  })

  describe('getBadgesWithProgress', () => {
    it('deve retornar badges conquistados com earnedAt', async () => {
      const earnedDate = new Date('2026-03-15')
      mockRepo.getBadgesByUser.mockResolvedValueOnce([
        { type: BadgeType.PRIMEIRA_DOACAO, awardedAt: earnedDate },
      ])
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(10)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(2)

      const result = await service.getBadgesWithProgress('user-1')

      const primeira = result.find((b) => b.type === BadgeType.PRIMEIRA_DOACAO)
      expect(primeira?.earned).toBe(true)
      expect(primeira?.earnedAt).toEqual(earnedDate)
    })

    it('deve retornar badges pendentes com progresso correto', async () => {
      mockRepo.getBadgesByUser.mockResolvedValueOnce([])
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(42)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(2)

      const result = await service.getBadgesWithProgress('user-1')

      const centuriao = result.find((b) => b.type === BadgeType.CENTURIAO)
      expect(centuriao?.earned).toBe(false)
      expect(centuriao?.current).toBe(42)
      expect(centuriao?.target).toBe(100)

      const frequente = result.find((b) => b.type === BadgeType.DOADOR_FREQUENTE)
      expect(frequente?.earned).toBe(false)
      expect(frequente?.current).toBe(2)
      expect(frequente?.target).toBe(4)
    })

    it('deve retornar todos os 5 tipos de badge', async () => {
      mockRepo.getBadgesByUser.mockResolvedValueOnce([])
      mockRepo.getCumulativeMealsByUser.mockResolvedValueOnce(0)
      mockRepo.getDonationCountForUserInMonth.mockResolvedValueOnce(0)

      const result = await service.getBadgesWithProgress('user-1')

      expect(result).toHaveLength(5)
      const types = result.map((b) => b.type)
      expect(types).toContain(BadgeType.PRIMEIRA_DOACAO)
      expect(types).toContain(BadgeType.DOADOR_FREQUENTE)
      expect(types).toContain(BadgeType.HEROI_DO_MES)
      expect(types).toContain(BadgeType.CENTURIAO)
      expect(types).toContain(BadgeType.MESTRE)
    })
  })
})
