/**
 * Contrato 5 — BannerStatus (filtragem ACTIVE)
 *
 * Valida que getActiveBanners retorna apenas banners ACTIVE não expirados.
 * @see module-25-contract-testing/TASK-3/ST001-ST002
 */

import { describe, it, expect, afterEach } from 'vitest'
import { BannerStatus, BannerType, BannerPosition, UserRole } from '@prisma/client'
import { prismaTest } from './setup'

describe('Contrato 5 — BannerStatus', () => {
  const ids: { users: string[]; banners: string[] } = { users: [], banners: [] }

  afterEach(async () => {
    await prismaTest.bannerCampaign.deleteMany({ where: { id: { in: ids.banners } } })
    await prismaTest.sponsorProfile.deleteMany({ where: { userId: { in: ids.users } } })
    await prismaTest.user.deleteMany({ where: { id: { in: ids.users } } })
    ids.users.length = 0; ids.banners.length = 0
  })

  it('[CONTRACT] BannerStatus tem 6 estados: DRAFT, ACTIVE, PAUSED, SCHEDULED, COMPLETED, REJECTED', () => {
    expect(BannerStatus.DRAFT).toBe('DRAFT')
    expect(BannerStatus.ACTIVE).toBe('ACTIVE')
    expect(BannerStatus.PAUSED).toBe('PAUSED')
    expect(BannerStatus.SCHEDULED).toBe('SCHEDULED')
    expect(BannerStatus.COMPLETED).toBe('COMPLETED')
    expect(BannerStatus.REJECTED).toBe('REJECTED')
    // Nenhum estado extra não documentado
    const allStatuses = Object.keys(BannerStatus)
    expect(allStatuses).toHaveLength(6)
  })

  it('[SUCCESS] getActiveBanners retorna APENAS banners ACTIVE', async () => {
    const sponsor = await prismaTest.user.create({
      data: {
        email: `ct5-sp-${Date.now()}@test.com`,
        role: UserRole.PATROCINADOR,
        name: 'Sponsor CT5',
        isVerified: true,
        sponsorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '0') } },
      },
    })
    ids.users.push(sponsor.id)

    const base = {
      type: BannerType.PAID,
      advertiserId: sponsor.id,
      imageUrl: 'https://test.example.com/ct5.jpg',
      linkUrl: 'https://test.example.com',
      position: BannerPosition.TOP,
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000 * 30),
    }

    // Criar 1 banner para cada status
    const statuses = [
      BannerStatus.DRAFT,
      BannerStatus.ACTIVE,
      BannerStatus.PAUSED,
      BannerStatus.SCHEDULED,
      BannerStatus.COMPLETED,
    ] as const

    for (const status of statuses) {
      const b = await prismaTest.bannerCampaign.create({
        data: { ...base, title: `CT5 ${status}`, status },
      })
      ids.banners.push(b.id)
    }

    const { BannerService } = await import('@/services/banner.service')
    const bannerService = new BannerService()
    const active = await bannerService.getActiveBanners(BannerPosition.TOP)

    // Filtrar apenas os criados neste teste
    const testActive = active.filter((b) => ids.banners.includes(b.id))

    // Somente o ACTIVE deve aparecer
    expect(testActive.length).toBe(1)
    expect(testActive[0].status).toBe(BannerStatus.ACTIVE)
  })

  it('[EDGE] Banner ACTIVE com endDate no passado — não retorna na listagem', async () => {
    const sponsor2 = await prismaTest.user.create({
      data: {
        email: `ct5-exp-${Date.now()}@test.com`,
        role: UserRole.PATROCINADOR,
        name: 'Sponsor CT5 Exp',
        isVerified: true,
        sponsorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '1') } },
      },
    })
    ids.users.push(sponsor2.id)

    const expired = await prismaTest.bannerCampaign.create({
      data: {
        title: 'CT5 ACTIVE expired',
        type: BannerType.PAID,
        advertiserId: sponsor2.id,
        imageUrl: 'https://test.example.com/ct5-exp.jpg',
        position: BannerPosition.TOP,
        status: BannerStatus.ACTIVE,
        startDate: new Date(Date.now() - 86400000 * 10),
        endDate: new Date(Date.now() - 86400000), // ontem — expirado
      },
    })
    ids.banners.push(expired.id)

    const { BannerService } = await import('@/services/banner.service')
    const bannerService = new BannerService()
    const active = await bannerService.getActiveBanners(BannerPosition.TOP)

    const found = active.find((b) => b.id === expired.id)
    expect(found).toBeUndefined()
  })

  it('[SUCCESS] Schema do banner público — campos obrigatórios para landing page', async () => {
    const sponsor3 = await prismaTest.user.create({
      data: {
        email: `ct5-schema-${Date.now()}@test.com`,
        role: UserRole.PATROCINADOR,
        name: 'Sponsor CT5 Schema',
        isVerified: true,
        sponsorProfile: { create: { documentType: 'CNPJ', documentNumber: `${Date.now()}`.slice(0, 14).padStart(14, '2') } },
      },
    })
    ids.users.push(sponsor3.id)

    const banner = await prismaTest.bannerCampaign.create({
      data: {
        title: 'CT5 schema test',
        type: BannerType.PAID,
        advertiserId: sponsor3.id,
        imageUrl: 'https://test.example.com/ct5-schema.jpg',
        linkUrl: 'https://test.example.com/cta',
        position: BannerPosition.TOP,
        status: BannerStatus.ACTIVE,
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(Date.now() + 86400000 * 30),
      },
    })
    ids.banners.push(banner.id)

    const { BannerService } = await import('@/services/banner.service')
    const bannerService = new BannerService()
    const active = await bannerService.getActiveBanners(BannerPosition.TOP)
    const found = active.find((b) => b.id === banner.id)

    expect(found).toBeDefined()
    // Campos obrigatórios para landing page
    expect(found!.id).toBeDefined()
    expect(found!.imageUrl).toBeDefined()
    expect(found!.title).toBeDefined()
  })
})
