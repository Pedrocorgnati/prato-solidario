/**
 * Matching concurrency test — intake-review TASK-3/ST003
 *
 * Objetivo: provar que N receptores solicitando simultaneamente porcoes de uma
 * mesma doacao nunca ultrapassam `remainingPortions` disponivel. Comprova
 * anti-race via SELECT FOR UPDATE + Serializable + retry (ST001).
 *
 * Requer DATABASE_URL_TEST apontando para banco com migrations.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma'
import { retrievalService } from '@/services/retrieval.service'
import { donationRepository } from '@/repositories/donation.repository'
import { TEST_EMAIL_DOMAIN } from './setup'
import { endOfDayBRT } from '@/utils/date'
import { randomUUID } from 'node:crypto'
import { DonationType } from '@/types/enums'

interface Fixture {
  donationId: string
  donorUserId: string
}

async function createFixture(portions: number): Promise<Fixture> {
  const email = `matching-${Date.now()}${TEST_EMAIL_DOMAIN}`
  const donorUserId = randomUUID()

  const now = new Date()
  await prisma.user.create({
    data: {
      id: donorUserId,
      email,
      name: 'Matching Concurrency Donor',
      role: 'DOADOR_PF',
      isActive: true,
      termsAcceptedAt: now,
      privacyAcceptedAt: now,
    },
  })

  // PostGIS requer $executeRaw (location e Unsupported no Prisma) — usar repository
  const donation = await donationRepository.create({
    donorId: donorUserId,
    type: DonationType.REGULAR,
    description: 'Doação para teste de race condition',
    portions,
    radiusKm: 5,
    windowStart: now,
    windowEnd: endOfDayBRT(),
    location: { lat: -23.55, lng: -46.63 },
    address: {
      cep: '01310-100',
      logradouro: 'Av. Paulista',
      numero: '1000',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
    },
  })

  return { donationId: donation.id, donorUserId }
}

async function cleanupFixture(f: Fixture) {
  await prisma.retrievalCode.deleteMany({ where: { donationId: f.donationId } }).catch(() => {})
  await prisma.donation.delete({ where: { id: f.donationId } }).catch(() => {})
  await prisma.user.delete({ where: { id: f.donorUserId } }).catch(() => {})
}

describe('matching concurrency (TASK-3/ST003)', () => {
  let fixture: Fixture

  beforeAll(async () => {
    fixture = await createFixture(10)
  })

  afterAll(async () => {
    if (fixture) await cleanupFixture(fixture)
  })

  it('20 requests simultaneos contra 10 porcoes resultam em exatos 10 sucessos', async () => {
    const attempts = 20
    const perRequest = 1

    const results = await Promise.allSettled(
      Array.from({ length: attempts }).map(() =>
        retrievalService.generateRetrievalCode(
          { donationId: fixture.donationId, portions: perRequest },
          null,
          'INDIVIDUAL',
        ),
      ),
    )

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')

    expect(fulfilled.length).toBe(10)
    expect(rejected.length).toBe(10)

    // Todas as falhas sao por portions insuficientes (race bem tratada, nao erro interno)
    for (const r of rejected) {
      const msg = String((r as PromiseRejectedResult).reason?.message ?? '')
      expect(msg).toMatch(/DONATION_ALLOCATED|insufficient|not found/i)
    }

    // Donation zerada
    const donation = await prisma.donation.findUnique({
      where: { id: fixture.donationId },
      select: { remainingPortions: true },
    })
    expect(donation?.remainingPortions).toBe(0)

    // Sem codigos duplicados
    const codes = await prisma.retrievalCode.findMany({
      where: { donationId: fixture.donationId },
      select: { code: true },
    })
    const unique = new Set(codes.map((c) => c.code))
    expect(unique.size).toBe(codes.length)
    expect(codes.length).toBe(10)
  }, 30_000)
})
