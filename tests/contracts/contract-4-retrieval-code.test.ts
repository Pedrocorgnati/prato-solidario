/**
 * Contrato 4 — RetrievalCode (REGULAR e SPONSORED)
 *
 * Valida estrutura e transições de estado do RetrievalCode.
 * @see module-25-contract-testing/TASK-2/ST005-ST007
 */

import { describe, it, expect, afterEach } from 'vitest'
import {
  DonationType,
  DonationStatus,
  UserRole,
  RetrievalCodeStatus,
  CodeType,
} from '@prisma/client'
import { prismaTest } from './setup'

describe('Contrato 4 — RetrievalCode', () => {
  const ids: { users: string[]; donations: string[]; codes: string[]; meals: string[] } = {
    users: [],
    donations: [],
    codes: [],
    meals: [],
  }

  afterEach(async () => {
    await prismaTest.auditLog.deleteMany({ where: { userId: { in: ids.users } } })
    await prismaTest.retrievalCode.deleteMany({ where: { id: { in: ids.codes } } })
    await prismaTest.donation.deleteMany({ where: { id: { in: ids.donations } } })
    await prismaTest.sponsoredMeal.deleteMany({ where: { id: { in: ids.meals } } })
    await prismaTest.marmitariaProfile.deleteMany({ where: { userId: { in: ids.users } } })
    await prismaTest.sponsorProfile.deleteMany({ where: { userId: { in: ids.users } } })
    await prismaTest.donorProfile.deleteMany({ where: { userId: { in: ids.users } } })
    await prismaTest.receptorProfile.deleteMany({ where: { userId: { in: ids.users } } })
    await prismaTest.user.deleteMany({ where: { id: { in: ids.users } } })
    ids.users.length = 0; ids.donations.length = 0
    ids.codes.length = 0; ids.meals.length = 0
  })

  it('[CONTRACT] RetrievalCodeStatus tem estados ACTIVE, CONFIRMED, EXPIRED, CANCELLED', () => {
    expect(RetrievalCodeStatus.ACTIVE).toBe('ACTIVE')
    expect(RetrievalCodeStatus.CONFIRMED).toBe('CONFIRMED')
    expect(RetrievalCodeStatus.EXPIRED).toBe('EXPIRED')
    expect(RetrievalCodeStatus.CANCELLED).toBe('CANCELLED')
  })

  it('[SUCCESS] RetrievalCode REGULAR — estrutura correta (6 chars, ACTIVE, donationId)', async () => {
    const donor = await prismaTest.user.create({
      data: {
        email: `ct4-donor-${Date.now()}@test.com`,
        role: UserRole.DOADOR_RESTAURANTE,
        name: 'Donor CT4',
        isVerified: true,
        donorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '0') } },
      },
    })
    ids.users.push(donor.id)

    const receptor = await prismaTest.user.create({
      data: {
        email: `ct4-rec-${Date.now()}@test.com`,
        role: UserRole.RECEPTOR,
        name: 'Receptor CT4',
        isVerified: true,
        receptorProfile: { create: { cpf: `${Date.now()}`.slice(0, 11).padStart(11, '0') } },
      },
    })
    ids.users.push(receptor.id)

    const donation = await prismaTest.donation.create({
      data: {
        donorId: donor.id,
        type: DonationType.REGULAR,
        status: DonationStatus.RESERVED,
        description: 'CT4 REGULAR',
        portions: 3,
        remainingPortions: 3,
        pickupAddress: 'Rua CT4, 1, SP',
        expiresAt: new Date(Date.now() + 86400000),
      },
    })
    ids.donations.push(donation.id)

    // Gerar código via repository
    const { retrievalRepository } = await import('@/repositories/retrieval.repository')
    const codeValue = await retrievalRepository.generateCode('INDIVIDUAL')
    expect(codeValue).toMatch(/^\d{6}$/) // 6 dígitos numéricos

    const code = await retrievalRepository.create({
      donationId: donation.id,
      receptorId: receptor.id,
      code: codeValue,
      type: CodeType.INDIVIDUAL,
      portions: 1,
      expiresAt: new Date(Date.now() + 86400000),
    })
    ids.codes.push(code.id)

    // Verificar estrutura do contrato
    expect(code.code).toHaveLength(6)
    expect(code.status).toBe(RetrievalCodeStatus.ACTIVE)
    expect(code.donationId).toBe(donation.id)
    expect(code.expiresAt).toBeInstanceOf(Date)
  })

  it('[SUCCESS] Confirmar código — status muda para CONFIRMED, confirmedAt preenchido', async () => {
    const donor2 = await prismaTest.user.create({
      data: {
        email: `ct4-confirm-${Date.now()}@test.com`,
        role: UserRole.DOADOR_RESTAURANTE,
        name: 'Donor CT4 Confirm',
        isVerified: true,
        donorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '1') } },
      },
    })
    ids.users.push(donor2.id)

    const donation2 = await prismaTest.donation.create({
      data: {
        donorId: donor2.id,
        type: DonationType.REGULAR,
        status: DonationStatus.RESERVED,
        description: 'CT4 confirm',
        portions: 2,
        remainingPortions: 2,
        pickupAddress: 'Rua CT4, 2, SP',
        expiresAt: new Date(Date.now() + 86400000),
      },
    })
    ids.donations.push(donation2.id)

    const { retrievalRepository } = await import('@/repositories/retrieval.repository')
    const codeValue = await retrievalRepository.generateCode()
    const code2 = await retrievalRepository.create({
      donationId: donation2.id,
      code: codeValue,
      type: CodeType.INDIVIDUAL,
      portions: 1,
      expiresAt: new Date(Date.now() + 86400000),
    })
    ids.codes.push(code2.id)

    const confirmed = await retrievalRepository.confirm(code2.id)
    expect(confirmed.status).toBe(RetrievalCodeStatus.CONFIRMED)
    expect(confirmed.confirmedAt).toBeInstanceOf(Date)
  })

  it('[ERROR] Código expirado — erro ao confirmar, status permanece ACTIVE', async () => {
    const donor3 = await prismaTest.user.create({
      data: {
        email: `ct4-exp-${Date.now()}@test.com`,
        role: UserRole.DOADOR_RESTAURANTE,
        name: 'Donor CT4 Expired',
        isVerified: true,
        donorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '2') } },
      },
    })
    ids.users.push(donor3.id)

    const donation3 = await prismaTest.donation.create({
      data: {
        donorId: donor3.id,
        type: DonationType.REGULAR,
        status: DonationStatus.RESERVED,
        description: 'CT4 expired',
        portions: 1,
        remainingPortions: 1,
        pickupAddress: 'Rua CT4, 3, SP',
        expiresAt: new Date(Date.now() - 1000), // expirada
      },
    })
    ids.donations.push(donation3.id)

    const { retrievalRepository } = await import('@/repositories/retrieval.repository')
    const codeValue = await retrievalRepository.generateCode()
    const expiredCode = await retrievalRepository.create({
      donationId: donation3.id,
      code: codeValue,
      type: CodeType.INDIVIDUAL,
      portions: 1,
      expiresAt: new Date(Date.now() - 1000), // expirado há 1s
    })
    ids.codes.push(expiredCode.id)

    // Tentar confirmar código expirado deve falhar ou retornar erro
    await expect(retrievalRepository.confirm(expiredCode.id)).rejects.toThrow()

    // Status permanece ACTIVE (não CONFIRMED) e confirmedAt permanece null
    const unchanged = await prismaTest.retrievalCode.findUnique({ where: { id: expiredCode.id } })
    expect(unchanged!.status).toBe(RetrievalCodeStatus.ACTIVE)
    expect(unchanged!.confirmedAt).toBeNull()
  })

  // ─── ST006: RetrievalCode SPONSORED — mesmo contrato que REGULAR ──────────

  it('[SUCCESS] RetrievalCode SPONSORED — mesmo fluxo e estrutura que REGULAR', async () => {
    const donor = await prismaTest.user.create({
      data: {
        email: `ct4-sp-${Date.now()}@test.com`,
        role: UserRole.DOADOR_RESTAURANTE,
        name: 'Donor CT4 Sponsored',
        isVerified: true,
        donorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '9') } },
      },
    })
    ids.users.push(donor.id)

    const marmitariaUser = await prismaTest.user.create({
      data: {
        email: `ct4-marm-${Date.now()}@test.com`,
        role: UserRole.MARMITARIA,
        name: 'Marmitaria CT4',
        isVerified: true,
      },
    })
    ids.users.push(marmitariaUser.id)

    const marmitaria = await prismaTest.marmitariaProfile.create({
      data: {
        userId: marmitariaUser.id,
        tradeName: 'Marmitaria CT4',
        cnpj: `${Date.now()}`.slice(0, 14).padStart(14, '9'),
        status: 'ACTIVE',
        address: 'Rua CT4, 4, SP',
      },
    })

    const sponsorUser = await prismaTest.user.create({
      data: {
        email: `ct4-sponsor-${Date.now()}@test.com`,
        role: UserRole.PATROCINADOR,
        name: 'Sponsor CT4',
        isVerified: true,
        sponsorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '8') } },
      },
    })
    ids.users.push(sponsorUser.id)

    const meal = await prismaTest.sponsoredMeal.create({
      data: {
        marmitariaId: marmitaria.id,
        sponsorId: sponsorUser.id,
        name: 'Marmita CT4',
        description: 'Desc CT4',
        quantity: 3,
        remainingQuantity: 3,
        pricePerUnit: 10.0,
      },
    })
    ids.meals.push(meal.id)

    const sponsoredDonation = await prismaTest.donation.create({
      data: {
        donorId: donor.id,
        type: DonationType.SPONSORED,
        sponsoredMealId: meal.id,
        status: DonationStatus.RESERVED,
        description: 'CT4 SPONSORED',
        portions: 3,
        remainingPortions: 3,
        pickupAddress: 'Rua CT4, 4, SP',
        expiresAt: new Date(Date.now() + 86400000),
      },
    })
    ids.donations.push(sponsoredDonation.id)

    // Gerar código — mesma estrutura que REGULAR
    const { retrievalRepository } = await import('@/repositories/retrieval.repository')
    const codeValue = await retrievalRepository.generateCode('INDIVIDUAL')
    expect(codeValue).toMatch(/^\d{6}$/)

    const code = await retrievalRepository.create({
      donationId: sponsoredDonation.id,
      code: codeValue,
      type: CodeType.INDIVIDUAL,
      portions: 1,
      expiresAt: new Date(Date.now() + 86400000),
    })
    ids.codes.push(code.id)

    // Contrato: mesma estrutura que REGULAR
    expect(code.code).toHaveLength(6)
    expect(code.status).toBe(RetrievalCodeStatus.ACTIVE)
    expect(code.donationId).toBe(sponsoredDonation.id)

    // Confirmar — mesmo fluxo
    const confirmed = await retrievalRepository.confirm(code.id)
    expect(confirmed.status).toBe(RetrievalCodeStatus.CONFIRMED)
    expect(confirmed.confirmedAt).toBeInstanceOf(Date)
  })
})
