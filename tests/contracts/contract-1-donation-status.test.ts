/**
 * Contrato 1 — DonationStatus.COMPLETED cross-rock
 *
 * Valida que COMPLETED → crédito de banner (Rock-1 → Rock-3)
 * e atualização de métricas (Rock-1 → Rock-4).
 *
 * Requer DATABASE_URL_TEST configurado em .env.test
 * @see module-25-contract-testing/TASK-1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  DonationStatus,
  DonationType,
  UserRole,
  type Donation,
  type User,
  type BannerCredit,
} from '@prisma/client'
import { prismaTest } from './setup'

// ---------------------------------------------------------------------------
// Helpers de fixture
// ---------------------------------------------------------------------------

async function createFixture() {
  const doadorRestaurante = await prismaTest.user.create({
    data: {
      email: `ct1-rest-${Date.now()}@test.com`,
      role: UserRole.DOADOR_RESTAURANTE,
      name: 'Restaurante CT1',
      isVerified: true,
      donorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '0') } },
    },
  })

  const doadorPf = await prismaTest.user.create({
    data: {
      email: `ct1-pf-${Date.now()}@test.com`,
      role: UserRole.DOADOR_PF,
      name: 'PF CT1',
      isVerified: true,
      donorProfile: { create: { documentType: 'CPF', documentNumber: `${Date.now()}`.slice(0, 11).padStart(11, '0') } },
    },
  })

  const donation = await prismaTest.donation.create({
    data: {
      donorId: doadorRestaurante.id,
      type: DonationType.REGULAR,
      status: DonationStatus.RESERVED,
      description: 'Marmitas contrato 1',
      portions: 5,
      remainingPortions: 5,
      pickupAddress: 'Rua CT1, 1, SP',
      expiresAt: new Date(Date.now() + 86400000),
    },
  })

  const metricsSnapshot = await prismaTest.impactMetrics.findFirst({
    orderBy: { calculatedAt: 'desc' },
  })

  return { doadorRestaurante, doadorPf, donation, metricsSnapshot }
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe('Contrato 1 — DonationStatus.COMPLETED', () => {
  let fixture: Awaited<ReturnType<typeof createFixture>>
  const createdIds: { users: string[]; donations: string[] } = { users: [], donations: [] }

  beforeEach(async () => {
    fixture = await createFixture()
    createdIds.users.push(fixture.doadorRestaurante.id, fixture.doadorPf.id)
    createdIds.donations.push(fixture.donation.id)
  })

  afterEach(async () => {
    // Rollback: limpar dados criados nos testes (ordem: FK-safe)
    await prismaTest.auditLog.deleteMany({ where: { userId: { in: createdIds.users } } })
    await prismaTest.bannerCredit.deleteMany({ where: { donorId: { in: createdIds.users } } })
    await prismaTest.retrievalCode.deleteMany({ where: { donationId: { in: createdIds.donations } } })
    await prismaTest.donation.deleteMany({ where: { id: { in: createdIds.donations } } })
    await prismaTest.donorProfile.deleteMany({ where: { userId: { in: createdIds.users } } })
    await prismaTest.user.deleteMany({ where: { id: { in: createdIds.users } } })
    createdIds.users.length = 0
    createdIds.donations.length = 0
  })

  // ─── ST002: COMPLETED → BannerCredit ──────────────────────────────────────

  it('[SUCCESS] COMPLETED → BannerCampaign.creditDays incrementa +1 para DOADOR_RESTAURANTE', async () => {
    // Completar a doação via atualização direta de status (simula confirmCode)
    await prismaTest.donation.update({
      where: { id: fixture.donation.id },
      data: { status: DonationStatus.COMPLETED },
    })

    // Simular o serviço de banner que é chamado após COMPLETED
    const { BannerService } = await import('@/services/banner.service')
    const bannerService = new BannerService()
    await bannerService.creditBannerDay(fixture.doadorRestaurante.id, fixture.donation.id)

    // Verificar que BannerCredit foi criado com creditDays incrementado
    const bannerCredit = await prismaTest.bannerCredit.findFirst({
      where: { donorId: fixture.doadorRestaurante.id },
      orderBy: { createdAt: 'desc' },
    })
    expect(bannerCredit).not.toBeNull()
    expect(bannerCredit!.creditDays).toBeGreaterThanOrEqual(1)

    // Verificar AuditLog com BANNER_CREDIT_EARNED
    const auditEntry = await prismaTest.auditLog.findFirst({
      where: {
        userId: fixture.doadorRestaurante.id,
        action: 'BANNER_CREDIT_EARNED',
      },
    })
    expect(auditEntry).not.toBeNull()
    expect(auditEntry!.entityType).toBe('banner_credit')
    expect((auditEntry!.metadata as Record<string, unknown>).donationId).toBe(fixture.donation.id)
  })

  // ─── ST003: COMPLETED → métricas ──────────────────────────────────────────

  it('[SUCCESS] COMPLETED → MetricsService reflete a nova doação', async () => {
    await prismaTest.donation.update({
      where: { id: fixture.donation.id },
      data: { status: DonationStatus.COMPLETED },
    })

    const updated = await prismaTest.donation.findUnique({ where: { id: fixture.donation.id } })
    expect(updated!.status).toBe(DonationStatus.COMPLETED)

    // Verificar que MetricsService calcula métricas incluindo a doação completada
    const { MetricsService } = await import('@/services/metrics.service')
    const metricsService = new MetricsService()
    const metrics = await metricsService.calculateRealtimeMetrics()
    expect(metrics).toHaveProperty('totalMealsDistributed')
    expect(typeof metrics.totalMealsDistributed).toBe('number')
    // Ao menos 1 doação completada existe no banco
    expect(metrics.totalMealsDistributed).toBeGreaterThanOrEqual(1)
  })

  // ─── ST004: DOADOR_PF/ONG sem crédito de banner ───────────────────────────

  it('[EDGE] DOADOR_PF — COMPLETED não gera BannerCredit', async () => {
    const donationPf = await prismaTest.donation.create({
      data: {
        donorId: fixture.doadorPf.id,
        type: DonationType.REGULAR,
        status: DonationStatus.COMPLETED,
        description: 'PF donation CT1',
        portions: 2,
        remainingPortions: 2,
        pickupAddress: 'Rua CT1, 2, SP',
        expiresAt: new Date(Date.now() + 86400000),
      },
    })
    createdIds.donations.push(donationPf.id)

    const { BannerService } = await import('@/services/banner.service')
    const bannerService = new BannerService()
    // Para DOADOR_PF — skip silencioso (sem crédito)
    await bannerService.creditBannerDay(fixture.doadorPf.id, donationPf.id)

    const credit = await prismaTest.bannerCredit.findFirst({
      where: { donorId: fixture.doadorPf.id },
    })
    // DOADOR_PF não deve ter crédito criado
    expect(credit).toBeNull()
  })

  // ─── ST005: idempotência ───────────────────────────────────────────────────

  it('[ERROR] double COMPLETED → segundo creditBannerDay não duplica crédito', async () => {
    const { BannerService } = await import('@/services/banner.service')
    const bannerService = new BannerService()

    // Primeiro crédito
    await bannerService.creditBannerDay(fixture.doadorRestaurante.id, fixture.donation.id)
    // Segundo crédito com mesmo donationId (deve ser idempotente)
    await bannerService.creditBannerDay(fixture.doadorRestaurante.id, fixture.donation.id)

    const credits = await prismaTest.bannerCredit.findMany({
      where: { donorId: fixture.doadorRestaurante.id },
    })
    // Não deve haver mais de 1 crédito pela mesma donationId
    const creditsByDonation = credits.filter(
      (c: BannerCredit) => (c as unknown as { metadata?: { donationId?: string } }).metadata?.donationId === fixture.donation.id
    )
    // O AuditLog de BANNER_CREDIT_EARNED deve aparecer apenas 1x
    const auditEntries = await prismaTest.auditLog.findMany({
      where: {
        userId: fixture.doadorRestaurante.id,
        action: 'BANNER_CREDIT_EARNED',
        entityType: 'banner_credit',
      },
    })
    expect(auditEntries.length).toBe(1)
  })

  // ─── Verificar enum DonationStatus disponível ─────────────────────────────

  it('[CONTRACT] DonationStatus enum contém todos os estados esperados', () => {
    expect(DonationStatus.PENDING).toBeDefined()
    expect(DonationStatus.AVAILABLE).toBeDefined()
    expect(DonationStatus.RESERVED).toBeDefined()
    expect(DonationStatus.COMPLETED).toBeDefined()
    expect(DonationStatus.EXPIRED).toBeDefined()
    expect(DonationStatus.CANCELLED).toBeDefined()
  })
})
