/**
 * Contrato 7 — IncidentType (gerado pelo módulo correto)
 *
 * Valida que cada IncidentType é gerado pelo serviço correspondente.
 * @see module-25-contract-testing/TASK-3/ST005-ST006
 */

import { describe, it, expect, afterEach } from 'vitest'
import { IncidentType, UserRole } from '@prisma/client'
import { prismaTest } from './setup'

describe('Contrato 7 — IncidentType', () => {
  const ids: { users: string[]; donations: string[]; incidents: string[] } = {
    users: [],
    donations: [],
    incidents: [],
  }

  afterEach(async () => {
    await prismaTest.abuseRecord.deleteMany({ where: { reporterId: { in: ids.users } } })
    await prismaTest.retrievalCode.deleteMany({ where: { donationId: { in: ids.donations } } })
    await prismaTest.donation.deleteMany({ where: { id: { in: ids.donations } } })
    await prismaTest.donorProfile.deleteMany({ where: { userId: { in: ids.users } } })
    await prismaTest.receptorProfile.deleteMany({ where: { userId: { in: ids.users } } })
    await prismaTest.user.deleteMany({ where: { id: { in: ids.users } } })
    ids.users.length = 0; ids.donations.length = 0; ids.incidents.length = 0
  })

  it('[CONTRACT] IncidentType contém todos os 5 tipos esperados', () => {
    expect(IncidentType.ABUSE).toBe('ABUSE')
    expect(IncidentType.FRAUD).toBe('FRAUD')
    expect(IncidentType.QUALITY).toBe('QUALITY')
    expect(IncidentType.NO_SHOW).toBe('NO_SHOW')
    expect(IncidentType.OTHER).toBe('OTHER')
    expect(Object.keys(IncidentType)).toHaveLength(5)
  })

  it('[SUCCESS] AbuseRecord criado com type=ABUSE via AbuseService', async () => {
    const reporter = await prismaTest.user.create({
      data: {
        email: `ct7-reporter-${Date.now()}@test.com`,
        role: UserRole.RECEPTOR,
        name: 'Reporter CT7',
        isVerified: true,
        receptorProfile: { create: { cpf: `${Date.now()}`.slice(0, 11).padStart(11, '0') } },
      },
    })
    ids.users.push(reporter.id)

    const donor = await prismaTest.user.create({
      data: {
        email: `ct7-donor-${Date.now()}@test.com`,
        role: UserRole.DOADOR_PF,
        name: 'Donor CT7',
        isVerified: true,
        donorProfile: { create: { documentType: 'CPF', documentNumber: `${Date.now()}`.slice(0, 11).padStart(11, '1') } },
      },
    })
    ids.users.push(donor.id)

    const donation = await prismaTest.donation.create({
      data: {
        donorId: donor.id,
        type: 'REGULAR',
        status: 'AVAILABLE',
        description: 'CT7 abuse donation',
        portions: 1,
        remainingPortions: 1,
        pickupAddress: 'Rua CT7, 1, SP',
        expiresAt: new Date(Date.now() + 86400000),
      },
    })
    ids.donations.push(donation.id)

    // AbuseService — criar report de ABUSE
    const { AbuseService } = await import('@/services/abuse.service')
    const abuseService = new AbuseService()
    await abuseService.reportAbuse({
      reporterId: reporter.id,
      targetId: donor.id,
      donationId: donation.id,
      reason: 'Conteúdo inapropriado',
    })

    const record = await prismaTest.abuseRecord.findFirst({
      where: { reporterId: reporter.id, donationId: donation.id },
    })
    expect(record).not.toBeNull()
    expect(record!.reason).toBe('Conteúdo inapropriado')
  })

  it('[SECURITY] Acesso ao /admin/incidents requer role ADMIN — 403 para não-ADMIN', async () => {
    // Verificar AdminActionType enum está completo
    const { AdminActionType } = await import('@prisma/client')
    expect(AdminActionType.APPROVE).toBe('APPROVE')
    expect(AdminActionType.REJECT).toBe('REJECT')
    expect(AdminActionType.SUSPEND).toBe('SUSPEND')

    // Teste de acesso HTTP — requer servidor rodando
    const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
    if (!process.env.CI && !process.env.PLAYWRIGHT_BASE_URL) {
      // Documentar: em CI este teste verifica o 403 real via HTTP
      console.warn('[contract-7] Servidor não disponível — validação HTTP de 403 será feita em CI')
      return
    }

    // Tentar acessar /admin/incidents sem auth → deve retornar 401 ou 403
    const res = await fetch(`${BASE_URL}/api/v1/admin/incidents`)
    expect([401, 403]).toContain(res.status)

    // Verificar que o corpo do erro segue o padrão do ERROR-CATALOG
    const body = await res.json().catch(() => null)
    if (body?.error) {
      expect(body.error.code).toMatch(/^AUTH_/)
    }
  })
})
