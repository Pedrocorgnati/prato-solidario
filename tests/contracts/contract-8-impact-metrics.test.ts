/**
 * Contrato 8 — ImpactMetrics (schema e cálculos)
 *
 * Valida que MetricsService retorna objeto com todos os campos do ImpactCounter
 * e que snapshots diários são append-only.
 * @see module-25-contract-testing/TASK-4/ST001-ST002
 */

import { describe, it, expect, afterEach } from 'vitest'
import { prismaTest } from './setup'

describe('Contrato 8 — ImpactMetrics', () => {
  const ids: { metrics: string[] } = { metrics: [] }

  afterEach(async () => {
    await prismaTest.impactMetrics.deleteMany({ where: { id: { in: ids.metrics } } })
    ids.metrics.length = 0
  })

  it('[SUCCESS] MetricsService.calculateRealtimeMetrics — 5 campos obrigatórios do ImpactCounter', async () => {
    const { MetricsService } = await import('@/services/metrics.service')
    const service = new MetricsService()
    const metrics = await service.calculateRealtimeMetrics()

    // Campos obrigatórios do ImpactCounter (landing page)
    expect(typeof metrics.totalMealsDistributed).toBe('number')
    expect(typeof metrics.activeDonationsToday).toBe('number')
    expect(typeof metrics.activeMarmitarias).toBe('number')
    expect(typeof metrics.kgFoodSaved).toBe('number')
    expect(typeof metrics.kgCO2Avoided).toBe('number')
  })

  it('[SUCCESS] kgFoodSaved = totalMeals * 0.5 (fórmula FEAT-EN-002)', async () => {
    // Seed: criar ao menos 1 doação COMPLETED para garantir métricas > 0
    const user = await prismaTest.user.create({
      data: {
        email: `ct8-formula-${Date.now()}@test.com`,
        role: 'DOADOR_PF',
        name: 'Donor CT8 Formula',
        isVerified: true,
        donorProfile: { create: { documentType: 'CPF', documentNumber: `${Date.now()}`.slice(0, 11).padStart(11, '0') } },
      },
    })
    const donation = await prismaTest.donation.create({
      data: {
        donorId: user.id,
        type: 'REGULAR',
        status: 'COMPLETED',
        description: 'CT8 formula seed',
        portions: 10,
        remainingPortions: 0,
        pickupAddress: 'Rua CT8, SP',
        expiresAt: new Date(Date.now() + 86400000),
      },
    })

    const { MetricsService } = await import('@/services/metrics.service')
    const service = new MetricsService()
    const metrics = await service.calculateRealtimeMetrics()

    // Com seed, métricas devem ter ao menos 1 refeição
    expect(metrics.totalMealsDistributed).toBeGreaterThanOrEqual(1)
    const expectedKg = metrics.totalMealsDistributed * 0.5
    expect(Math.abs(metrics.kgFoodSaved - expectedKg)).toBeLessThan(0.1)

    // Cleanup
    await prismaTest.donation.delete({ where: { id: donation.id } })
    await prismaTest.donorProfile.deleteMany({ where: { userId: user.id } })
    await prismaTest.user.delete({ where: { id: user.id } })
  })

  it('[SUCCESS] kgCO2Avoided = kgFoodSaved * 2.5 (fator IPCC AR6 FEAT-EN-008)', async () => {
    const { MetricsService } = await import('@/services/metrics.service')
    const service = new MetricsService()
    const metrics = await service.calculateRealtimeMetrics()

    // A fórmula é determinística — verificar independente do valor
    const expectedCO2 = metrics.kgFoodSaved * 2.5
    expect(Math.abs(metrics.kgCO2Avoided - expectedCO2)).toBeLessThan(0.1)
  })

  it('[SUCCESS] Snapshot diário append-only — histórico anterior preservado', async () => {
    // Criar snapshot de "ontem"
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(12, 0, 0, 0)

    const snap = await prismaTest.impactMetrics.create({
      data: {
        totalDonations: 100,
        totalPortions: 500,
        totalReceptors: 80,
        totalDonors: 40,
        totalMarmitarias: 10,
        totalSponsored: 5,
        calculatedAt: yesterday,
      },
    })
    ids.metrics.push(snap.id)

    const { MetricsService } = await import('@/services/metrics.service')
    const service = new MetricsService()
    await service.saveMetricsSnapshot()

    // O snapshot de ontem não deve ter sido alterado
    const yesterdaySnap = await prismaTest.impactMetrics.findUnique({ where: { id: snap.id } })
    expect(yesterdaySnap).not.toBeNull()
    expect(yesterdaySnap!.totalDonations).toBe(100)

    // Deve existir um novo snapshot de hoje
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySnaps = await prismaTest.impactMetrics.findMany({
      where: { calculatedAt: { gte: today } },
    })
    expect(todaySnaps.length).toBeGreaterThanOrEqual(1)
    for (const s of todaySnaps) ids.metrics.push(s.id)
  })

  it('[SUCCESS] getMetricsHistory(7) retorna array com entradas por dia', async () => {
    const { MetricsService } = await import('@/services/metrics.service')
    const service = new MetricsService()
    const history = await service.getMetricsHistory(7)

    expect(Array.isArray(history)).toBe(true)
    // Cada entrada deve ter as propriedades esperadas
    for (const entry of history) {
      expect(entry).toHaveProperty('totalMealsDistributed')
      expect(entry).toHaveProperty('calculatedAt')
    }
  })
})
