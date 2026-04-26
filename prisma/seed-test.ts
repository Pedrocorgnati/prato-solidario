/**
 * Seed de Teste — Prato Solidário (module-25)
 *
 * Cria fixtures mínimas para testes de contrato.
 * Banco alvo: DATABASE_URL_TEST (isolado de produção/staging).
 *
 * Executar:
 *   DATABASE_URL=<DATABASE_URL_TEST> npx prisma db push
 *   DATABASE_URL=<DATABASE_URL_TEST> npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-test.ts
 */

import {
  PrismaClient,
  UserRole,
  DonationStatus,
  DonationType,
  MarmitariaStatus,
  BannerStatus,
  BannerType,
  BannerPosition,
  Platform,
} from '@prisma/client'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL } },
})

async function main() {
  console.log('🌱 Iniciando seed de teste...')

  // ─── Limpar banco de teste ─────────────────────────────────────────────────
  await prisma.$executeRaw`SET session_replication_role = replica`
  await prisma.auditLog.deleteMany()
  await prisma.pushToken.deleteMany()
  await prisma.impactMetrics.deleteMany()
  await prisma.bannerCredit.deleteMany()
  await prisma.bannerCampaign.deleteMany()
  await prisma.retrievalCode.deleteMany()
  await prisma.donation.deleteMany()
  await prisma.marmitariaProfile.deleteMany()
  await prisma.donorProfile.deleteMany()
  await prisma.receptorProfile.deleteMany()
  await prisma.ongProfile.deleteMany()
  await prisma.sponsorProfile.deleteMany()
  await prisma.user.deleteMany()
  await prisma.$executeRaw`SET session_replication_role = DEFAULT`

  // ─── 1 usuário por role ────────────────────────────────────────────────────
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'doador-restaurante@test.com',
        role: UserRole.DOADOR_RESTAURANTE,
        name: 'Restaurante Teste',
        isVerified: true,
        donorProfile: {
          create: {
            documentType: 'CNPJ',
            documentNumber: '12345678000100',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'doador-pf@test.com',
        role: UserRole.DOADOR_PF,
        name: 'Doador PF Teste',
        isVerified: true,
        donorProfile: {
          create: {
            documentType: 'CPF',
            documentNumber: '12345678901',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'ong@test.com',
        role: UserRole.ONG,
        name: 'ONG Teste',
        isVerified: true,
        ongProfile: {
          create: {
            documentNumber: '98765432000100',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'receptor@test.com',
        role: UserRole.RECEPTOR,
        name: 'Receptor Teste',
        isVerified: true,
        receptorProfile: {
          create: {
            cpf: '98765432100',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        name: 'Admin Teste',
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'marmitaria@test.com',
        role: UserRole.MARMITARIA,
        name: 'Marmitaria Teste',
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'patrocinador@test.com',
        role: UserRole.PATROCINADOR,
        name: 'Patrocinador Teste',
        isVerified: true,
        sponsorProfile: {
          create: {
            documentType: 'CNPJ',
            documentNumber: '11111111000100',
            companyName: 'Empresa Patrocinadora Teste',
          },
        },
      },
    }),
  ])

  const [doadorRestaurante, doadorPf, ong, receptor, admin, marmitariaUser, patrocinador] = users

  // ─── 1 marmitaria ACTIVE ──────────────────────────────────────────────────
  const marmitaria = await prisma.marmitariaProfile.create({
    data: {
      userId: marmitariaUser.id,
      tradeName: 'Marmitaria Solidária Teste',
      cnpj: '22222222000100',
      status: MarmitariaStatus.ACTIVE,
      address: 'Rua Teste, 123, São Paulo, SP',
    },
  })

  // ─── 1 banner ACTIVE ──────────────────────────────────────────────────────
  await prisma.bannerCampaign.create({
    data: {
      title: 'Banner Teste Ativo',
      type: BannerType.PAID,
      advertiserId: patrocinador.id,
      imageUrl: 'https://test.example.com/banner.jpg',
      linkUrl: 'https://test.example.com',
      position: BannerPosition.TOP,
      status: BannerStatus.ACTIVE,
      startDate: new Date(Date.now() - 86400000), // ontem
      endDate: new Date(Date.now() + 86400000 * 30), // 30 dias
    },
  })

  // ─── 1 donation em cada status relevante ─────────────────────────────────
  const basedonation = {
    donorId: doadorRestaurante.id,
    description: 'Marmitas teste',
    portions: 10,
    remainingPortions: 10,
    pickupAddress: 'Rua Teste, 123, São Paulo, SP',
    expiresAt: new Date(Date.now() + 86400000 * 3),
  }

  await prisma.donation.createMany({
    data: [
      { ...basedonation, type: DonationType.REGULAR, status: DonationStatus.PENDING },
      { ...basedonation, type: DonationType.REGULAR, status: DonationStatus.AVAILABLE },
      { ...basedonation, type: DonationType.REGULAR, status: DonationStatus.RESERVED },
      { ...basedonation, type: DonationType.REGULAR, status: DonationStatus.COMPLETED },
    ],
  })

  // ─── Métricas de impacto iniciais ─────────────────────────────────────────
  await prisma.impactMetrics.create({
    data: {
      totalDonations: 1,
      totalPortions: 10,
      totalReceptors: 1,
      totalDonors: 2,
      totalMarmitarias: 1,
      totalSponsored: 0,
    },
  })

  console.log('✅ Seed de teste concluído.')
  console.log(`  Usuários: ${users.length}`)
  console.log(`  Marmitaria ACTIVE: ${marmitaria.tradeName}`)
  console.log(`  Donations: 4 (PENDING/AVAILABLE/RESERVED/COMPLETED)`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed de teste:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
