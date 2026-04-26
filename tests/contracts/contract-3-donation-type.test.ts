/**
 * Contrato 3 — DonationType.SPONSORED no enum Prisma
 *
 * Valida enum DonationType, validação de sponsoredMealId,
 * e que SPONSORED não gera crédito de banner.
 * @see module-25-contract-testing/TASK-2/ST003-ST004
 */

import { describe, it, expect, afterEach } from 'vitest'
import { DonationType, DonationStatus, UserRole, type Prisma } from '@prisma/client'
import { prismaTest } from './setup'

describe('Contrato 3 — DonationType.SPONSORED', () => {
  const createdIds: { users: string[]; donations: string[]; meals: string[] } = {
    users: [],
    donations: [],
    meals: [],
  }

  afterEach(async () => {
    await prismaTest.bannerCredit.deleteMany({ where: { donorId: { in: createdIds.users } } })
    await prismaTest.auditLog.deleteMany({ where: { userId: { in: createdIds.users } } })
    await prismaTest.retrievalCode.deleteMany({ where: { donationId: { in: createdIds.donations } } })
    await prismaTest.donation.deleteMany({ where: { id: { in: createdIds.donations } } })
    await prismaTest.sponsoredMeal.deleteMany({ where: { id: { in: createdIds.meals } } })
    await prismaTest.marmitariaProfile.deleteMany({ where: { userId: { in: createdIds.users } } })
    await prismaTest.sponsorProfile.deleteMany({ where: { userId: { in: createdIds.users } } })
    await prismaTest.donorProfile.deleteMany({ where: { userId: { in: createdIds.users } } })
    await prismaTest.user.deleteMany({ where: { id: { in: createdIds.users } } })
    createdIds.users.length = 0
    createdIds.donations.length = 0
    createdIds.meals.length = 0
  })

  it('[CONTRACT] DonationType enum contém REGULAR e SPONSORED', () => {
    expect(DonationType.REGULAR).toBe('REGULAR')
    expect(DonationType.SPONSORED).toBe('SPONSORED')
    expect(Object.keys(DonationType)).toHaveLength(2)
  })

  it('[SUCCESS] SPONSORED com sponsoredMealId válido — criada com sucesso', async () => {
    const donor = await prismaTest.user.create({
      data: {
        email: `ct3-donor-${Date.now()}@test.com`,
        role: UserRole.DOADOR_RESTAURANTE,
        name: 'Donor CT3',
        isVerified: true,
        donorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '0') } },
      },
    })
    createdIds.users.push(donor.id)

    const marmitariaUser = await prismaTest.user.create({
      data: {
        email: `ct3-marm-${Date.now()}@test.com`,
        role: UserRole.MARMITARIA,
        name: 'Marmitaria CT3',
        isVerified: true,
      },
    })
    createdIds.users.push(marmitariaUser.id)

    const marmitaria = await prismaTest.marmitariaProfile.create({
      data: {
        userId: marmitariaUser.id,
        tradeName: 'Marmitaria CT3',
        cnpj: `${Date.now()}`.slice(0, 14).padStart(14, '3'),
        status: 'ACTIVE',
        address: 'Rua CT3, 1, SP',
      },
    })

    const sponsorUser = await prismaTest.user.create({
      data: {
        email: `ct3-sp-${Date.now()}@test.com`,
        role: UserRole.PATROCINADOR,
        name: 'Sponsor CT3',
        isVerified: true,
        sponsorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '4') } },
      },
    })
    createdIds.users.push(sponsorUser.id)

    const meal = await prismaTest.sponsoredMeal.create({
      data: {
        marmitariaId: marmitaria.id,
        sponsorId: sponsorUser.id,
        name: 'Marmita CT3',
        description: 'Desc CT3',
        quantity: 5,
        remainingQuantity: 5,
        pricePerUnit: 12.5,
      },
    })
    createdIds.meals.push(meal.id)

    const sponsored = await prismaTest.donation.create({
      data: {
        donorId: donor.id,
        type: DonationType.SPONSORED,
        sponsoredMealId: meal.id,
        status: DonationStatus.AVAILABLE,
        description: 'Doação patrocinada CT3',
        portions: 5,
        remainingPortions: 5,
        pickupAddress: 'Rua CT3, 1, SP',
        expiresAt: new Date(Date.now() + 86400000),
      },
    })
    createdIds.donations.push(sponsored.id)

    expect(sponsored.type).toBe(DonationType.SPONSORED)
    expect(sponsored.sponsoredMealId).toBe(meal.id)
  })

  it('[ERROR] SPONSORED sem sponsoredMealId — viola constraint de negócio', async () => {
    // O modelo Prisma permite null mas a regra de negócio exige sponsoredMealId
    // Este teste documenta que a validação ocorre na camada de serviço
    const donor = await prismaTest.user.create({
      data: {
        email: `ct3-nosp-${Date.now()}@test.com`,
        role: UserRole.DOADOR_RESTAURANTE,
        name: 'Donor NoSp CT3',
        isVerified: true,
        donorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '5') } },
      },
    })
    createdIds.users.push(donor.id)

    // Importar DonationService para validação em nível de serviço
    const { DonationService } = await import('@/services/donation.service')
    const service = new DonationService()

    // Criar SPONSORED sem sponsoredMealId deve lançar erro de validação
    await expect(
      service.createDonation({
        donorId: donor.id,
        type: 'SPONSORED',
        description: 'CT3 sem sponsoredMealId',
        portions: 2,
        pickupAddress: 'Rua CT3, 2, SP',
        windowStart: new Date(),
        windowEnd: new Date(Date.now() + 3600000),
        // sponsoredMealId ausente intencional
      } as Parameters<typeof service.createDonation>[0])
    ).rejects.toThrow()
  })

  it('[EDGE] SPONSORED COMPLETED — não gera BannerCredit', async () => {
    const donor = await prismaTest.user.create({
      data: {
        email: `ct3-nobanner-${Date.now()}@test.com`,
        role: UserRole.DOADOR_RESTAURANTE,
        name: 'Donor NoBanner CT3',
        isVerified: true,
        donorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '6') } },
      },
    })
    createdIds.users.push(donor.id)

    const marmitariaUser2 = await prismaTest.user.create({
      data: {
        email: `ct3-marm2-${Date.now()}@test.com`,
        role: UserRole.MARMITARIA,
        name: 'Marmitaria CT3-2',
        isVerified: true,
      },
    })
    createdIds.users.push(marmitariaUser2.id)

    const marmitaria2 = await prismaTest.marmitariaProfile.create({
      data: {
        userId: marmitariaUser2.id,
        tradeName: 'Marmitaria CT3-2',
        cnpj: `${Date.now()}`.slice(0, 14).padStart(14, '7'),
        status: 'ACTIVE',
        address: 'Rua CT3, 2, SP',
      },
    })

    const sponsorUser2 = await prismaTest.user.create({
      data: {
        email: `ct3-sp2-${Date.now()}@test.com`,
        role: UserRole.PATROCINADOR,
        name: 'Sponsor CT3-2',
        isVerified: true,
        sponsorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '8') } },
      },
    })
    createdIds.users.push(sponsorUser2.id)

    const meal2 = await prismaTest.sponsoredMeal.create({
      data: {
        marmitariaId: marmitaria2.id,
        sponsorId: sponsorUser2.id,
        name: 'Marmita CT3-2',
        description: 'Desc CT3-2',
        quantity: 3,
        remainingQuantity: 3,
        pricePerUnit: 10.0,
      },
    })
    createdIds.meals.push(meal2.id)

    const sponsoredDonation = await prismaTest.donation.create({
      data: {
        donorId: donor.id,
        type: DonationType.SPONSORED,
        sponsoredMealId: meal2.id,
        status: DonationStatus.COMPLETED,
        description: 'Doação patrocinada CT3-2',
        portions: 3,
        remainingPortions: 0,
        pickupAddress: 'Rua CT3, 2, SP',
        expiresAt: new Date(Date.now() + 86400000),
      },
    })
    createdIds.donations.push(sponsoredDonation.id)

    // Invocar BannerService para verificar que o guard de tipo impede crédito
    const { BannerService } = await import('@/services/banner.service')
    const bannerService = new BannerService()
    // O contrato estabelece que creditBannerDay deve rejeitar ou ignorar
    // doações SPONSORED (crédito apenas para REGULAR via confirmCode)
    await bannerService.creditBannerDay(donor.id, sponsoredDonation.id)

    const credit = await prismaTest.bannerCredit.findFirst({
      where: { donorId: donor.id },
    })
    // SPONSORED COMPLETED NÃO deve gerar BannerCredit
    expect(credit).toBeNull()
  })
})
