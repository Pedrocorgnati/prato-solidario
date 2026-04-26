/**
 * Seed de Usuarios de Teste — Prato Solidário (JavaScript)
 *
 * Cria usuarios de teste para cada role do sistema usando PrismaClient direto.
 *
 * Executar: node scripts/seed-test-users.js
 *
 * Requer: DATABASE_URL configurada em .env
 */

const { PrismaClient, UserRole } = require('@prisma/client')

const prisma = new PrismaClient()

const TEST_USERS = [
  {
    role: 'ADMIN',
    email: 'admin4testing@corgnati.com',
    password: 'Password4testing!',
    name: 'Adminston Testwell',
    phone: '+55 11 98765-4321',
    document: '12345678901',
    documentType: 'CPF',
    photoUrl:
      'https://ui-avatars.com/api/?name=Adminston+Testwell&background=random&size=200',
    isActive: true,
    emailVerified: true,
  },
  {
    role: 'DOADOR_PF',
    email: 'clien4testing@corgnati.com',
    password: 'Password4testing!',
    name: 'Clienzo Testavero',
    phone: '+55 21 97654-3210',
    document: '98765432100',
    documentType: 'CPF',
    photoUrl:
      'https://ui-avatars.com/api/?name=Clienzo+Testavero&background=random&size=200',
    isActive: true,
    emailVerified: true,
  },
  {
    role: 'RECEPTOR',
    email: 'lead4testing@corgnati.com',
    password: 'Password4testing!',
    name: 'Leadsandro Testeodoro',
    phone: '+55 31 96543-2109',
    document: '45678912300',
    documentType: 'CPF',
    photoUrl:
      'https://ui-avatars.com/api/?name=Leadsandro+Testeodoro&background=random&size=200',
    isActive: true,
    emailVerified: true,
  },
  {
    role: 'DOADOR_RESTAURANTE',
    email: 'restaurante@prato-solidario.test',
    password: 'Test@Restaurante2025!',
    name: 'Marina Costa',
    phone: '+55 41 95432-1098',
    document: '11222333000181',
    documentType: 'CNPJ',
    photoUrl:
      'https://ui-avatars.com/api/?name=Marina+Costa&background=random&size=200',
    isActive: true,
    emailVerified: true,
  },
  {
    role: 'MARMITARIA',
    email: 'marmitaria@prato-solidario.test',
    password: 'Test@Marmitaria2025!',
    name: 'Lucas Almeida',
    phone: '+55 51 94321-0987',
    document: '44555666000122',
    documentType: 'CNPJ',
    photoUrl:
      'https://ui-avatars.com/api/?name=Lucas+Almeida&background=random&size=200',
    isActive: true,
    emailVerified: true,
  },
  {
    role: 'ONG',
    email: 'ong@prato-solidario.test',
    password: 'Test@ONG2025!',
    name: 'Beatriz Lima',
    phone: '+55 61 93210-9876',
    document: '77888999000163',
    documentType: 'CNPJ',
    photoUrl:
      'https://ui-avatars.com/api/?name=Beatriz+Lima&background=random&size=200',
    isActive: true,
    emailVerified: true,
  },
  {
    role: 'PATROCINADOR',
    email: 'patrocinador@prato-solidario.test',
    password: 'Test@Patrocinador2025!',
    name: 'Fernando Souza',
    phone: '+55 71 92109-8765',
    document: '33444555000144',
    documentType: 'CNPJ',
    photoUrl:
      'https://ui-avatars.com/api/?name=Fernando+Souza&background=random&size=200',
    isActive: true,
    emailVerified: true,
  },
]

async function main() {
  console.log('🌱 Iniciando seed de usuarios de teste...\n')

  let created = 0
  let skipped = 0

  try {
    for (const testUser of TEST_USERS) {
      const existingUser = await prisma.user.findUnique({
        where: { email: testUser.email },
      })

      if (!existingUser) {
        const user = await prisma.user.create({
          data: {
            email: testUser.email,
            name: testUser.name,
            role: testUser.role,
            phone: testUser.phone,
            document: testUser.document,
            documentType: testUser.documentType,
            photoUrl: testUser.photoUrl,
            isActive: testUser.isActive,
            emailVerified: testUser.emailVerified,
            termsAcceptedAt: new Date(),
            privacyAcceptedAt: new Date(),
            termsVersion: '1.0',
          },
        })

        console.log(
          `✅ [${testUser.role}] ${testUser.name} (${testUser.email}) — criado`,
        )
        created++
      } else {
        console.log(
          `⏭️  [${existingUser.role}] ${existingUser.name} (${existingUser.email}) — ja existe`,
        )
        skipped++
      }
    }

    // ---------------------------------------------------------------------------
    // Criar perfis associados
    // ---------------------------------------------------------------------------
    console.log('\n📋 Criando perfis de usuario...\n')

    // DonorProfile
    const doadorPF = await prisma.user.findUnique({
      where: { email: 'clien4testing@corgnati.com' },
    })
    if (doadorPF) {
      const existingDonorProfile = await prisma.donorProfile.findUnique({
        where: { userId: doadorPF.id },
      })
      if (!existingDonorProfile) {
        await prisma.donorProfile.create({
          data: {
            userId: doadorPF.id,
            preferredTimes: { start: '10:00', end: '18:00' },
          },
        })
        console.log(
          `✅ DonorProfile criado para DOADOR_PF (${doadorPF.email})`,
        )
      }
    }

    // ReceptorProfile
    const receptor = await prisma.user.findUnique({
      where: { email: 'lead4testing@corgnati.com' },
    })
    if (receptor) {
      const existingReceptorProfile = await prisma.receptorProfile.findUnique({
        where: { userId: receptor.id },
      })
      if (!existingReceptorProfile) {
        await prisma.receptorProfile.create({
          data: {
            userId: receptor.id,
            familySize: 4,
            blockLevel: 'NONE',
          },
        })
        console.log(
          `✅ ReceptorProfile criado para RECEPTOR (${receptor.email})`,
        )
      }
    }

    // RestaurantProfile
    const restaurante = await prisma.user.findUnique({
      where: { email: 'restaurante@prato-solidario.test' },
    })
    if (restaurante) {
      const existingRestaurantProfile =
        await prisma.restaurantProfile.findUnique({
          where: { userId: restaurante.id },
        })
      if (!existingRestaurantProfile) {
        await prisma.restaurantProfile.create({
          data: {
            userId: restaurante.id,
            tradeName: 'Restaurante Teste',
            cnpj: '11222333000181',
            averagePortions: 50,
          },
        })
        console.log(
          `✅ RestaurantProfile criado para DOADOR_RESTAURANTE (${restaurante.email})`,
        )
      }
    }

    // MarmitariaProfile
    const marmitaria = await prisma.user.findUnique({
      where: { email: 'marmitaria@prato-solidario.test' },
    })
    if (marmitaria) {
      const existingMarmitariaProfile =
        await prisma.marmitariaProfile.findUnique({
          where: { userId: marmitaria.id },
        })
      if (!existingMarmitariaProfile) {
        const profile = await prisma.marmitariaProfile.create({
          data: {
            userId: marmitaria.id,
            tradeName: 'Marmitaria Teste',
            cnpj: '44555666000122',
            status: 'ACTIVE',
            pricePerMeal: 15.0,
            schedule: { mon: '10:00-18:00', tue: '10:00-18:00' },
          },
        })
        console.log(
          `✅ MarmitariaProfile criado para MARMITARIA (${marmitaria.email})`,
        )

        // MarmitariaBalance
        const existingBalance = await prisma.marmitariaBalance.findUnique({
          where: { marmitariaId: profile.id },
        })
        if (!existingBalance) {
          await prisma.marmitariaBalance.create({
            data: {
              marmitariaId: profile.id,
              availableCredits: 0,
              totalEarned: 0,
              totalWithdrawn: 0,
            },
          })
        }
      }
    }

    // OngProfile
    const ong = await prisma.user.findUnique({
      where: { email: 'ong@prato-solidario.test' },
    })
    if (ong) {
      const existingOngProfile = await prisma.ongProfile.findUnique({
        where: { userId: ong.id },
      })
      if (!existingOngProfile) {
        await prisma.ongProfile.create({
          data: {
            userId: ong.id,
            cnpj: '77888999000163',
            registrationNo: 'ONG-001-TEST',
          },
        })
        console.log(`✅ OngProfile criado para ONG (${ong.email})`)
      }
    }

    // SponsorProfile
    const sponsor = await prisma.user.findUnique({
      where: { email: 'patrocinador@prato-solidario.test' },
    })
    if (sponsor) {
      const existingSponsorProfile = await prisma.sponsorProfile.findUnique({
        where: { userId: sponsor.id },
      })
      if (!existingSponsorProfile) {
        await prisma.sponsorProfile.create({
          data: {
            userId: sponsor.id,
            companyName: 'Empresa Patrocinadora Teste',
            cnpj: '33444555000144',
          },
        })
        console.log(
          `✅ SponsorProfile criado para PATROCINADOR (${sponsor.email})`,
        )

        // BannerCredit
        const existingCredit = await prisma.bannerCredit.findUnique({
          where: { restaurantId: sponsor.id },
        })
        if (!existingCredit) {
          await prisma.bannerCredit.create({
            data: {
              restaurantId: sponsor.id,
              daysAvailable: 30,
              daysUsed: 0,
            },
          })
        }
      }
    }

    // ---------------------------------------------------------------------------
    // Resumo
    // ---------------------------------------------------------------------------
    const totalUsers = await prisma.user.count()
    console.log(`\n📊 Resumo:`)
    console.log(`   ✅ Criados: ${created}`)
    console.log(`   ⏭️  Ja existentes: ${skipped}`)
    console.log(`   📈 Total no banco: ${totalUsers}`)
    console.log(`\n✅ Seed de usuarios de teste concluido com sucesso!`)
  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
