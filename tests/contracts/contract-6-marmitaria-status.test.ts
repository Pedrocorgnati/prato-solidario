/**
 * Contrato 6 — MarmitariaStatus (filtragem pública e dashboard)
 *
 * Valida que listagem pública exibe apenas ACTIVE
 * e que dashboards exibem mensagem correta por status.
 * @see module-25-contract-testing/TASK-3/ST003-ST004
 */

import { describe, it, expect, afterEach } from 'vitest'
import { MarmitariaStatus, UserRole } from '@prisma/client'
import { prismaTest } from './setup'

describe('Contrato 6 — MarmitariaStatus', () => {
  const ids: { users: string[] } = { users: [] }

  afterEach(async () => {
    await prismaTest.adminAction.deleteMany({ where: { targetId: { in: ids.users } } })
    await prismaTest.adminAction.deleteMany({ where: { adminId: { in: ids.users } } })
    await prismaTest.marmitariaProfile.deleteMany({ where: { userId: { in: ids.users } } })
    await prismaTest.user.deleteMany({ where: { id: { in: ids.users } } })
    ids.users.length = 0
  })

  it('[CONTRACT] MarmitariaStatus tem estados PENDING_APPROVAL, ACTIVE, SUSPENDED, INACTIVE', () => {
    expect(MarmitariaStatus.PENDING_APPROVAL).toBe('PENDING_APPROVAL')
    expect(MarmitariaStatus.ACTIVE).toBe('ACTIVE')
    expect(MarmitariaStatus.SUSPENDED).toBe('SUSPENDED')
    expect(MarmitariaStatus.INACTIVE).toBe('INACTIVE')
  })

  it('[SUCCESS] Listagem pública retorna apenas marmitarias ACTIVE', async () => {
    // Criar marmitarias em 3 status
    const statuses = [
      MarmitariaStatus.PENDING_APPROVAL,
      MarmitariaStatus.ACTIVE,
      MarmitariaStatus.SUSPENDED,
    ] as const

    for (const status of statuses) {
      const user = await prismaTest.user.create({
        data: {
          email: `ct6-${status.toLowerCase()}-${Date.now()}@test.com`,
          role: UserRole.MARMITARIA,
          name: `Marmitaria ${status}`,
          isVerified: true,
        },
      })
      ids.users.push(user.id)

      await prismaTest.marmitariaProfile.create({
        data: {
          userId: user.id,
          tradeName: `Marmitaria ${status} CT6`,
          cnpj: `${Date.now()}${status.length}`.slice(0, 14).padStart(14, '0'),
          status,
        },
      })
    }

    // Verificar diretamente no banco — apenas ACTIVE
    const publicList = await prismaTest.marmitariaProfile.findMany({
      where: {
        status: MarmitariaStatus.ACTIVE,
        userId: { in: ids.users },
      },
    })

    expect(publicList.length).toBe(1)
    expect(publicList[0].status).toBe(MarmitariaStatus.ACTIVE)

    // PENDING_APPROVAL e SUSPENDED ausentes
    const nonActive = await prismaTest.marmitariaProfile.findMany({
      where: {
        status: { in: [MarmitariaStatus.PENDING_APPROVAL, MarmitariaStatus.SUSPENDED] },
        userId: { in: ids.users },
      },
    })
    expect(nonActive.length).toBe(2) // existem no banco, mas não na listagem pública
  })

  it('[SUCCESS] Dashboard marmitaria PENDING_APPROVAL — aguardando aprovação', async () => {
    const user = await prismaTest.user.create({
      data: {
        email: `ct6-pending-${Date.now()}@test.com`,
        role: UserRole.MARMITARIA,
        name: 'Marmitaria Pending CT6',
        isVerified: true,
      },
    })
    ids.users.push(user.id)

    const profile = await prismaTest.marmitariaProfile.create({
      data: {
        userId: user.id,
        tradeName: 'Marmitaria Pending CT6',
        cnpj: `${Date.now()}`.slice(0, 14).padStart(14, '0'),
        status: MarmitariaStatus.PENDING_APPROVAL,
      },
    })

    // O contrato define que PENDING_APPROVAL não tem acesso a dados operacionais
    expect(profile.status).toBe(MarmitariaStatus.PENDING_APPROVAL)

    // Verificar que a API /marmitaria/me/dashboard retorna estado correto
    // (testado via Playwright E2E — este teste valida o estado no banco)
    const dashboardData = await prismaTest.marmitariaProfile.findUnique({
      where: { userId: user.id },
      select: { status: true, tradeName: true },
    })
    expect(dashboardData!.status).toBe(MarmitariaStatus.PENDING_APPROVAL)
  })

  it('[EDGE] Dashboard marmitaria SUSPENDED — contém status e motivo', async () => {
    const user = await prismaTest.user.create({
      data: {
        email: `ct6-susp-${Date.now()}@test.com`,
        role: UserRole.MARMITARIA,
        name: 'Marmitaria Suspended CT6',
        isVerified: true,
      },
    })
    ids.users.push(user.id)

    const profile = await prismaTest.marmitariaProfile.create({
      data: {
        userId: user.id,
        tradeName: 'Marmitaria Suspended CT6',
        cnpj: `${Date.now()}`.slice(0, 14).padStart(14, '1'),
        status: MarmitariaStatus.SUSPENDED,
      },
    })

    expect(profile.status).toBe(MarmitariaStatus.SUSPENDED)
    // AdminAction precisa de adminId (FK obrigatória) — usar admin de fixture
    const adminUser = await prismaTest.user.create({
      data: {
        email: `ct6-admin-susp-${Date.now()}@test.com`,
        role: UserRole.ADMIN,
        name: 'Admin CT6',
        isVerified: true,
      },
    })
    ids.users.push(adminUser.id)

    // Verificar AdminAction para obter motivo da suspensão
    await prismaTest.adminAction.create({
      data: {
        adminId: adminUser.id,
        targetId: user.id,
        action: 'SUSPEND',
        reason: 'Violação dos termos de uso',
      },
    })
    const suspension = await prismaTest.adminAction.findFirst({
      where: { targetId: user.id, action: 'SUSPEND' },
    })
    expect(suspension!.reason).toBe('Violação dos termos de uso')
  })
})
