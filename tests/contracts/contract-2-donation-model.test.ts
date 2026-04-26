/**
 * Contrato 2 — Donation Model base vs SPONSORED
 *
 * Valida compatibilidade do modelo Donation para tipos REGULAR e SPONSORED.
 * @see module-25-contract-testing/TASK-2/ST001-ST002
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DonationType, DonationStatus, UserRole } from '@prisma/client'
import { prismaTest } from './setup'

describe('Contrato 2 — Donation Model (REGULAR vs SPONSORED)', () => {
  const createdIds: { users: string[]; donations: string[]; meals: string[] } = {
    users: [],
    donations: [],
    meals: [],
  }

  beforeEach(async () => {
    // criados inline em cada teste
  })

  afterEach(async () => {
    await prismaTest.retrievalCode.deleteMany({ where: { donationId: { in: createdIds.donations } } })
    await prismaTest.donation.deleteMany({ where: { id: { in: createdIds.donations } } })
    await prismaTest.sponsoredMeal.deleteMany({ where: { id: { in: createdIds.meals } } })
    await prismaTest.donorProfile.deleteMany({ where: { userId: { in: createdIds.users } } })
    await prismaTest.marmitariaProfile.deleteMany({ where: { userId: { in: createdIds.users } } })
    await prismaTest.sponsorProfile.deleteMany({ where: { userId: { in: createdIds.users } } })
    await prismaTest.user.deleteMany({ where: { id: { in: createdIds.users } } })
    createdIds.users.length = 0
    createdIds.donations.length = 0
    createdIds.meals.length = 0
  })

  it('[SUCCESS] REGULAR e SPONSORED coexistem — campos obrigatórios Rock-1 presentes', async () => {
    const donor = await prismaTest.user.create({
      data: {
        email: `ct2-donor-${Date.now()}@test.com`,
        role: UserRole.DOADOR_RESTAURANTE,
        name: 'Donor CT2',
        isVerified: true,
        donorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '0') } },
      },
    })
    createdIds.users.push(donor.id)

    const marmitariaUser = await prismaTest.user.create({
      data: {
        email: `ct2-marm-${Date.now()}@test.com`,
        role: UserRole.MARMITARIA,
        name: 'Marmitaria CT2',
        isVerified: true,
      },
    })
    createdIds.users.push(marmitariaUser.id)

    const marmitaria = await prismaTest.marmitariaProfile.create({
      data: {
        userId: marmitariaUser.id,
        tradeName: 'Marmitaria Test CT2',
        cnpj: `${Date.now()}`.slice(0, 14).padStart(14, '0'),
        status: 'ACTIVE',
        address: 'Rua CT2, 1, SP',
      },
    })

    const sponsor = await prismaTest.user.create({
      data: {
        email: `ct2-sponsor-${Date.now()}@test.com`,
        role: UserRole.PATROCINADOR,
        name: 'Sponsor CT2',
        isVerified: true,
        sponsorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '1') } },
      },
    })
    createdIds.users.push(sponsor.id)

    const meal = await prismaTest.sponsoredMeal.create({
      data: {
        marmitariaId: marmitaria.id,
        sponsorId: sponsor.id,
        name: 'Marmita Teste CT2',
        description: 'Descrição marmita CT2',
        quantity: 10,
        remainingQuantity: 10,
        pricePerUnit: 15.0,
      },
    })
    createdIds.meals.push(meal.id)

    const baseFields = {
      donorId: donor.id,
      description: 'Doação base CT2',
      portions: 5,
      remainingPortions: 5,
      pickupAddress: 'Rua CT2, 1, SP',
      expiresAt: new Date(Date.now() + 86400000),
      status: DonationStatus.AVAILABLE,
    }

    const regular = await prismaTest.donation.create({
      data: { ...baseFields, type: DonationType.REGULAR },
    })
    createdIds.donations.push(regular.id)

    const sponsored = await prismaTest.donation.create({
      data: { ...baseFields, type: DonationType.SPONSORED, sponsoredMealId: meal.id },
    })
    createdIds.donations.push(sponsored.id)

    // Campos obrigatórios Rock-1 presentes em ambos
    for (const d of [regular, sponsored]) {
      expect(d.description).toBeDefined()
      expect(d.portions).toBeGreaterThan(0)
      expect(d.pickupAddress).toBeDefined()
      expect(d.expiresAt).toBeInstanceOf(Date)
      expect(d.status).toBeDefined()
    }

    // REGULAR sem sponsoredMealId
    expect(regular.sponsoredMealId).toBeNull()
    // SPONSORED com sponsoredMealId
    expect(sponsored.sponsoredMealId).toBe(meal.id)
  })

  it('[EDGE] REGULAR.sponsoredMealId é null (não undefined) — serialização correta', async () => {
    const donor = await prismaTest.user.create({
      data: {
        email: `ct2-null-${Date.now()}@test.com`,
        role: UserRole.DOADOR_RESTAURANTE,
        name: 'Donor CT2 Null',
        isVerified: true,
        donorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '2') } },
      },
    })
    createdIds.users.push(donor.id)

    const donation = await prismaTest.donation.create({
      data: {
        donorId: donor.id,
        type: DonationType.REGULAR,
        status: DonationStatus.AVAILABLE,
        description: 'CT2 null test',
        portions: 1,
        remainingPortions: 1,
        pickupAddress: 'Rua CT2, 2, SP',
        expiresAt: new Date(Date.now() + 86400000),
      },
    })
    createdIds.donations.push(donation.id)

    const found = await prismaTest.donation.findUnique({ where: { id: donation.id } })
    // null explícito, não undefined
    expect(found!.sponsoredMealId).toBeNull()
    expect(found!.sponsoredMealId).not.toBeUndefined()

    // JSON serialization: null persiste
    const json = JSON.parse(JSON.stringify(found))
    expect(json.sponsoredMealId).toBeNull()
  })
})
