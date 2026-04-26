/**
 * Seed Script — Prato Solidário
 * Gerado por /seed-data-create em 2026-04-08
 *
 * Cobertura:
 *  - 11 usuários (todos os 7 roles + edge cases de receptor e marmitaria)
 *  - Todos os perfis associados (donor, restaurant, receptor, ong, marmitaria, sponsor)
 *  - Doações: 6 status (PENDING/AVAILABLE/RESERVED/COMPLETED/EXPIRED/CANCELLED) × 2 tipos
 *  - Códigos de retirada: 4 status (ACTIVE/CONFIRMED/EXPIRED/CANCELLED) + tipo FAMILY
 *  - MarmitariaProfile: 4 status (ACTIVE/PENDING_APPROVAL/SUSPENDED/INACTIVE)
 *  - MPConnection: 3 status (CONNECTED/NEEDS_RECONNECT/DISCONNECTED)
 *  - Banners: 6 status × 3 tipos × 3 posições
 *  - BannerCreditHistory: EARNED/USED/EXPIRED
 *  - SponsorPurchase: 4 status × 3 métodos de pagamento + guest checkout
 *  - SponsoredMeal: AVAILABLE/RESERVED/DELIVERED
 *  - AdminActions: todos os 6 tipos (APPROVE/REJECT/SUSPEND/UNBLOCK/WARN/DELETE)
 *  - ConsentLogs: V1 e V2
 *  - PushTokens: android/ios/web
 *  - Badges: todos os 5 tipos
 *  - Diplomas, AbuseRecords, ProcessedWebhooks, ImpactMetrics
 *
 * NOTA SUPABASE: Este script cria apenas registros em public.users (espelho do auth).
 * Para autenticação funcional em dev, crie os usuários também no Supabase Auth
 * via Dashboard → Authentication → Users, ou usando supabaseAdmin.auth.admin.createUser().
 *
 * Executar: bun run db:seed  (ou npx prisma db seed)
 * Resetar:  bun run db:reset
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  UserRole,
  DocumentType,
  MarmitariaStatus,
  Platform,
  DonationStatus,
  DonationType,
  RetrievalCodeStatus,
  CodeType,
  BlockLevel,
  BannerStatus,
  BannerType,
  BannerPosition,
  BannerCreditType,
  ConsentVersion,
  AdminActionType,
  MPConnectionStatus,
  PaymentMethod,
  PurchaseStatus,
  SponsoredMealStatus,
  BadgeType,
} from '@prisma/client'

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/pratosolidario'
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const NOW = new Date()
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000)
const yr = NOW.getFullYear()
const mo = NOW.getMonth() + 1

// ---------------------------------------------------------------------------
// IDs fixos — anchor records referenciáveis em testes
// ---------------------------------------------------------------------------
const UID = {
  admin:        'a0000000-0000-0000-0000-000000000001',
  doadorPf:     'a0000000-0000-0000-0000-000000000002',
  doadorRest:   'a0000000-0000-0000-0000-000000000003',
  marmAtiva:    'a0000000-0000-0000-0000-000000000004',
  receptor:     'a0000000-0000-0000-0000-000000000005',
  ong:          'a0000000-0000-0000-0000-000000000006',
  patrocinador: 'a0000000-0000-0000-0000-000000000007',
  recBlocked:   'a0000000-0000-0000-0000-000000000008',
  marmPending:  'a0000000-0000-0000-0000-000000000009',
  marmSusp:     'a0000000-0000-0000-0000-000000000010',
  marmInativa:  'a0000000-0000-0000-0000-000000000011',
}

const DID = {
  pending:   'd0000000-0000-0000-0001-000000000001',
  available: 'd0000000-0000-0000-0001-000000000002',
  reserved:  'd0000000-0000-0000-0001-000000000003',
  completed: 'd0000000-0000-0000-0001-000000000004',
  expired:   'd0000000-0000-0000-0001-000000000005',
  cancelled: 'd0000000-0000-0000-0001-000000000006',
  sponsored: 'd0000000-0000-0000-0002-000000000001',
}

const BID = {
  paidActive:  'b0000000-0000-0000-0001-000000000001',
  freeRest:    'b0000000-0000-0000-0001-000000000002',
  permuta:     'b0000000-0000-0000-0001-000000000003',
  draft:       'b0000000-0000-0000-0001-000000000004',
  paused:      'b0000000-0000-0000-0001-000000000005',
  completed:   'b0000000-0000-0000-0001-000000000006',
  rejected:    'b0000000-0000-0000-0001-000000000007',
}

const PID = {
  pixApproved:   'c0000001-0000-0000-0000-000000000001',
  ccPending:     'c0000001-0000-0000-0000-000000000002',
  debitRejected: 'c0000001-0000-0000-0000-000000000003',
  guestPix:      'c0000001-0000-0000-0000-000000000004',
  refunded:      'c0000001-0000-0000-0000-000000000005',
}

// ---------------------------------------------------------------------------

async function main() {
  console.log('Iniciando seed...')

  // ==========================================================================
  // NÍVEL 0 — Usuários (upsert por id fixo)
  // ==========================================================================

  await prisma.user.upsert({
    where: { id: UID.admin },
    update: {},
    create: {
      id: UID.admin,
      email: 'admin+seed@pratosolidario.com.br',
      role: UserRole.ADMIN,
      name: 'Administrador',
      emailVerified: true,
      isActive: true,
      termsAcceptedAt: days(-30),
      privacyAcceptedAt: days(-30),
      termsVersion: '1.0',
    },
  })

  await prisma.user.upsert({
    where: { id: UID.doadorPf },
    update: {},
    create: {
      id: UID.doadorPf,
      email: 'carlos.oliveira+seed@example.com',
      role: UserRole.DOADOR_PF,
      name: 'Carlos Oliveira',
      phone: '11987654321',
      document: '12345678901',
      documentType: DocumentType.CPF,
      emailVerified: true,
      isActive: true,
      hallOfFame: true,
      termsAcceptedAt: days(-60),
      privacyAcceptedAt: days(-60),
      termsVersion: '1.0',
    },
  })

  await prisma.user.upsert({
    where: { id: UID.doadorRest },
    update: {},
    create: {
      id: UID.doadorRest,
      email: 'bom-sabor+seed@example.com',
      role: UserRole.DOADOR_RESTAURANTE,
      name: 'Restaurante Bom Sabor',
      phone: '1132109876',
      document: '12345678000195',
      documentType: DocumentType.CNPJ,
      emailVerified: true,
      isActive: true,
      termsAcceptedAt: days(-45),
      privacyAcceptedAt: days(-45),
      termsVersion: '1.0',
    },
  })

  await prisma.user.upsert({
    where: { id: UID.marmAtiva },
    update: {},
    create: {
      id: UID.marmAtiva,
      email: 'marmitaria-feliz+seed@example.com',
      role: UserRole.MARMITARIA,
      name: 'Marmitaria Feliz',
      phone: '11955551234',
      document: '98765432000110',
      documentType: DocumentType.CNPJ,
      emailVerified: true,
      isActive: true,
      marmitariaStatus: MarmitariaStatus.ACTIVE,
      marmitariaPrice: 18.90,
      marmitariaSchedule: {
        seg: '11:00-14:00', ter: '11:00-14:00', qua: '11:00-14:00',
        qui: '11:00-14:00', sex: '11:00-14:00',
      },
      termsAcceptedAt: days(-90),
      privacyAcceptedAt: days(-90),
      termsVersion: '1.0',
    },
  })

  await prisma.user.upsert({
    where: { id: UID.receptor },
    update: {},
    create: {
      id: UID.receptor,
      email: 'joao.silva+seed@example.com',
      role: UserRole.RECEPTOR,
      name: 'João da Silva',
      emailVerified: true,
      isActive: true,
      termsAcceptedAt: days(-10),
      privacyAcceptedAt: days(-10),
      termsVersion: '1.0',
    },
  })

  await prisma.user.upsert({
    where: { id: UID.ong },
    update: {},
    create: {
      id: UID.ong,
      email: 'ong-esperanca+seed@example.com',
      role: UserRole.ONG,
      name: 'ONG Esperança Solidária',
      phone: '11933334444',
      document: '11222333000181',
      documentType: DocumentType.CNPJ,
      emailVerified: true,
      isActive: true,
      isRedistributor: true,
      termsAcceptedAt: days(-120),
      privacyAcceptedAt: days(-120),
      termsVersion: '1.0',
    },
  })

  await prisma.user.upsert({
    where: { id: UID.patrocinador },
    update: {},
    create: {
      id: UID.patrocinador,
      email: 'patrocinador+seed@example.com',
      role: UserRole.PATROCINADOR,
      name: 'Empresa Solidária S.A.',
      document: '44455566000177',
      documentType: DocumentType.CNPJ,
      emailVerified: true,
      isActive: true,
      termsAcceptedAt: days(-30),
      privacyAcceptedAt: days(-30),
      termsVersion: '1.0',
    },
  })

  // --- Edge case: receptor bloqueado (BlockLevel.THREE_DAYS) ----------------
  await prisma.user.upsert({
    where: { id: UID.recBlocked },
    update: {},
    create: {
      id: UID.recBlocked,
      email: 'receptor-bloqueado+seed@example.com',
      role: UserRole.RECEPTOR,
      name: 'Maria Santos',
      emailVerified: true,
      isActive: true,
      termsAcceptedAt: days(-5),
      privacyAcceptedAt: days(-5),
      termsVersion: '1.0',
    },
  })

  // --- Marmitarias em estados diferentes ------------------------------------
  await prisma.user.upsert({
    where: { id: UID.marmPending },
    update: {},
    create: {
      id: UID.marmPending,
      email: 'marmitaria-ze+seed@example.com',
      role: UserRole.MARMITARIA,
      name: 'Marmitaria do Zé',
      document: '55566677000188',
      documentType: DocumentType.CNPJ,
      emailVerified: true,
      isActive: true,
      marmitariaStatus: MarmitariaStatus.PENDING_APPROVAL,
      marmitariaPrice: 15.00,
      termsAcceptedAt: days(-2),
      privacyAcceptedAt: days(-2),
      termsVersion: '1.0',
    },
  })

  await prisma.user.upsert({
    where: { id: UID.marmSusp },
    update: {},
    create: {
      id: UID.marmSusp,
      email: 'marmitaria-suspensa+seed@example.com',
      role: UserRole.MARMITARIA,
      name: 'Marmitaria Suspensa Ltda',
      document: '66677788000199',
      documentType: DocumentType.CNPJ,
      emailVerified: false, // e-mail não verificado (edge case)
      isActive: true,
      marmitariaStatus: MarmitariaStatus.SUSPENDED,
      marmitariaPrice: 20.00,
      termsAcceptedAt: days(-30),
      privacyAcceptedAt: days(-30),
      termsVersion: '1.0',
    },
  })

  await prisma.user.upsert({
    where: { id: UID.marmInativa },
    update: {},
    create: {
      id: UID.marmInativa,
      email: 'marmitaria-inativa+seed@example.com',
      role: UserRole.MARMITARIA,
      name: 'Marmitaria Inativa ME',
      document: '77788899000100',
      documentType: DocumentType.CNPJ,
      emailVerified: true,
      isActive: false, // conta inativa
      marmitariaStatus: MarmitariaStatus.INACTIVE,
      termsAcceptedAt: days(-180),
      privacyAcceptedAt: days(-180),
      termsVersion: '1.0',
    },
  })

  // ==========================================================================
  // NÍVEL 1 — Perfis por role
  // ==========================================================================

  await prisma.donorProfile.upsert({
    where: { userId: UID.doadorPf },
    update: {},
    create: {
      userId: UID.doadorPf,
      preferredTimes: { manha: true, tarde: false, noite: false },
    },
  })

  await prisma.donorProfile.upsert({
    where: { userId: UID.doadorRest },
    update: {},
    create: {
      userId: UID.doadorRest,
      preferredTimes: { manha: false, tarde: true, noite: false },
    },
  })

  await prisma.restaurantProfile.upsert({
    where: { userId: UID.doadorRest },
    update: {},
    create: {
      userId: UID.doadorRest,
      tradeName: 'Bom Sabor Refeições Ltda',
      cnpj: '12345678000195',
      averagePortions: 50,
    },
  })

  // Receptor normal (BlockLevel.NONE, família de 3)
  await prisma.receptorProfile.upsert({
    where: { userId: UID.receptor },
    update: {},
    create: {
      userId: UID.receptor,
      familySize: 3,
      blockLevel: BlockLevel.NONE,
    },
  })

  // Edge case: receptor bloqueado progressivamente
  await prisma.receptorProfile.upsert({
    where: { userId: UID.recBlocked },
    update: {},
    create: {
      userId: UID.recBlocked,
      familySize: 1,
      blockLevel: BlockLevel.THREE_DAYS,
      blockedUntil: days(2),
    },
  })

  await prisma.ongProfile.upsert({
    where: { userId: UID.ong },
    update: {},
    create: {
      userId: UID.ong,
      cnpj: '11222333000181',
      registrationNo: 'ONG-SP-2021-007',
    },
  })

  const sponsorProfile = await prisma.sponsorProfile.upsert({
    where: { userId: UID.patrocinador },
    update: {},
    create: {
      userId: UID.patrocinador,
      companyName: 'Empresa Solidária S.A.',
      cnpj: '44455566000177',
    },
  })

  // ==========================================================================
  // NÍVEL 1 — MarmitariaProfiles (4 status) + Balance + MPConnection
  // ==========================================================================

  // ACTIVE — com Mercado Pago conectado
  const marmProfile1 = await prisma.marmitariaProfile.upsert({
    where: { cnpj: '98765432000110' },
    update: {},
    create: {
      userId: UID.marmAtiva,
      tradeName: 'Marmitaria Feliz',
      cnpj: '98765432000110',
      status: MarmitariaStatus.ACTIVE,
      pricePerMeal: 18.90,
      schedule: {
        seg: '11:00-14:00', ter: '11:00-14:00', qua: '11:00-14:00',
        qui: '11:00-14:00', sex: '11:00-14:00',
      },
      balance: {
        create: { availableCredits: 42, totalEarned: 756.00, totalWithdrawn: 0.00 },
      },
      mpConnection: {
        create: {
          mpUserId: 'MP_USER_12345',
          publicKey: 'APP_USR-test-public-key',
          liveMode: false,
          expiresAt: days(180),
          status: MPConnectionStatus.CONNECTED,
        },
      },
    },
  })

  // PENDING_APPROVAL — sem conexão MP ainda
  const marmProfile2 = await prisma.marmitariaProfile.upsert({
    where: { cnpj: '55566677000188' },
    update: {},
    create: {
      userId: UID.marmPending,
      tradeName: 'Marmitaria do Zé',
      cnpj: '55566677000188',
      status: MarmitariaStatus.PENDING_APPROVAL,
      pricePerMeal: 15.00,
      balance: {
        create: { availableCredits: 0, totalEarned: 0, totalWithdrawn: 0 },
      },
    },
  })

  // SUSPENDED — conexão MP precisa de reconexão
  await prisma.marmitariaProfile.upsert({
    where: { cnpj: '66677788000199' },
    update: {},
    create: {
      userId: UID.marmSusp,
      tradeName: 'Marmitaria Suspensa Ltda',
      cnpj: '66677788000199',
      status: MarmitariaStatus.SUSPENDED,
      pricePerMeal: 20.00,
      balance: {
        create: { availableCredits: 5, totalEarned: 90.00, totalWithdrawn: 0 },
      },
      mpConnection: {
        create: {
          status: MPConnectionStatus.NEEDS_RECONNECT,
          liveMode: false,
        },
      },
    },
  })

  // INACTIVE — conexão MP desconectada, saldo zerado
  await prisma.marmitariaProfile.upsert({
    where: { cnpj: '77788899000100' },
    update: {},
    create: {
      userId: UID.marmInativa,
      tradeName: 'Marmitaria Inativa ME',
      cnpj: '77788899000100',
      status: MarmitariaStatus.INACTIVE,
      balance: {
        create: { availableCredits: 0, totalEarned: 210.00, totalWithdrawn: 210.00 },
      },
      mpConnection: {
        create: {
          status: MPConnectionStatus.DISCONNECTED,
          liveMode: false,
        },
      },
    },
  })

  // ==========================================================================
  // NÍVEL 1 — Endereços
  // ==========================================================================

  const addrRestExists = await prisma.address.count({ where: { userId: UID.doadorRest } })
  if (!addrRestExists) {
    await prisma.address.create({
      data: {
        userId: UID.doadorRest,
        cep: '01310100',
        logradouro: 'Avenida Paulista',
        numero: '1000',
        complemento: 'Loja 5',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP',
        lat: -23.5613,
        lng: -46.6558,
        isPrimary: true,
      },
    })
  }

  const addrMarmExists = await prisma.address.count({ where: { userId: UID.marmAtiva } })
  if (!addrMarmExists) {
    await prisma.address.create({
      data: {
        userId: UID.marmAtiva,
        cep: '04001000',
        logradouro: 'Rua Vergueiro',
        numero: '500',
        bairro: 'Paraíso',
        cidade: 'São Paulo',
        estado: 'SP',
        lat: -23.5785,
        lng: -46.6402,
        isPrimary: true,
      },
    })
  }

  // ==========================================================================
  // NÍVEL 1 — BannerCredit (restaurante ganha créditos por doações)
  // ==========================================================================

  const bannerCredit = await prisma.bannerCredit.upsert({
    where: { restaurantId: UID.doadorRest },
    update: {},
    create: {
      restaurantId: UID.doadorRest,
      daysAvailable: 7,
      daysUsed: 2,
    },
  })

  // ==========================================================================
  // NÍVEL 2 — Doações (6 status × 2 tipos — sem PostGIS location no seed)
  // ==========================================================================

  const baseDonation = {
    donorId: UID.doadorRest,
    portions: 20,
    remainingPortions: 20,
    radiusKm: 5,
    photoUrl: 'https://picsum.photos/seed/doacao-bom-sabor/800/600',
  }

  const donAvailable = await prisma.donation.upsert({
    where: { id: DID.available },
    update: {},
    create: {
      id: DID.available,
      ...baseDonation,
      type: DonationType.REGULAR,
      status: DonationStatus.AVAILABLE,
      description: 'Sopa de legumes com carne — disponível para retirada',
      remainingPortions: 15,
      windowStart: days(-1),
      windowEnd: days(1),
    },
  })

  const donReserved = await prisma.donation.upsert({
    where: { id: DID.reserved },
    update: {},
    create: {
      id: DID.reserved,
      ...baseDonation,
      type: DonationType.REGULAR,
      status: DonationStatus.RESERVED,
      description: 'Macarronada com molho de carne — parcialmente reservada',
      remainingPortions: 8,
      windowStart: days(-1),
      windowEnd: days(1),
    },
  })

  const donCompleted = await prisma.donation.upsert({
    where: { id: DID.completed },
    update: {},
    create: {
      id: DID.completed,
      ...baseDonation,
      type: DonationType.REGULAR,
      status: DonationStatus.COMPLETED,
      description: 'Arroz com feijão e bife — concluída com sucesso',
      portions: 30,
      remainingPortions: 0,
      windowStart: days(-3),
      windowEnd: days(-2),
    },
  })

  // Edge case: doação com janela aberta mas ainda não publicada
  await prisma.donation.upsert({
    where: { id: DID.pending },
    update: {},
    create: {
      id: DID.pending,
      ...baseDonation,
      type: DonationType.REGULAR,
      status: DonationStatus.PENDING,
      description: 'Marmitas de frango com legumes — aguardando confirmação',
      windowStart: days(0),
      windowEnd: days(1),
    },
  })

  // Edge case: doação expirada sem retirada (estado de erro)
  const donExpired = await prisma.donation.upsert({
    where: { id: DID.expired },
    update: {},
    create: {
      id: DID.expired,
      ...baseDonation,
      type: DonationType.REGULAR,
      status: DonationStatus.EXPIRED,
      description: 'Doação expirada — ninguém retirou dentro da janela',
      windowStart: days(-5),
      windowEnd: days(-3),
    },
  })

  // Edge case: doação cancelada pelo doador
  const donCancelled = await prisma.donation.upsert({
    where: { id: DID.cancelled },
    update: {},
    create: {
      id: DID.cancelled,
      ...baseDonation,
      type: DonationType.REGULAR,
      status: DonationStatus.CANCELLED,
      description: 'Doação cancelada pelo restaurante antes da janela',
      windowStart: days(-2),
      windowEnd: days(-1),
    },
  })

  // Doação SPONSORED (tipo patrocinado)
  const donSponsored = await prisma.donation.upsert({
    where: { id: DID.sponsored },
    update: {},
    create: {
      id: DID.sponsored,
      donorId: UID.doadorPf,
      type: DonationType.SPONSORED,
      status: DonationStatus.AVAILABLE,
      description: 'Marmitas patrocinadas pela Empresa Solidária S.A.',
      portions: 10,
      remainingPortions: 7,
      radiusKm: 10,
      windowStart: days(-1),
      windowEnd: days(2),
    },
  })

  // ==========================================================================
  // NÍVEL 3 — Códigos de Retirada (4 status + tipo FAMILY)
  // ==========================================================================

  await prisma.retrievalCode.upsert({
    where: { code: 'ATIVO-001' },
    update: {},
    create: {
      donationId: DID.available,
      receptorId: UID.receptor,
      code: 'ATIVO-001',
      type: CodeType.INDIVIDUAL,
      status: RetrievalCodeStatus.ACTIVE,
      portions: 1,
      expiresAt: days(1),
    },
  })

  await prisma.retrievalCode.upsert({
    where: { code: 'CONF-001' },
    update: {},
    create: {
      donationId: DID.completed,
      receptorId: UID.receptor,
      code: 'CONF-001',
      type: CodeType.INDIVIDUAL,
      status: RetrievalCodeStatus.CONFIRMED,
      portions: 1,
      expiresAt: days(-2),
      confirmedAt: days(-2),
    },
  })

  // Edge case: código vencido — receptor faltou (no-show)
  await prisma.retrievalCode.upsert({
    where: { code: 'EXP-001' },
    update: {},
    create: {
      donationId: DID.expired,
      receptorId: UID.recBlocked,
      code: 'EXP-001',
      type: CodeType.INDIVIDUAL,
      status: RetrievalCodeStatus.EXPIRED,
      portions: 1,
      expiresAt: days(-3),
    },
  })

  // Código cancelado (doação cancelada antes da retirada)
  await prisma.retrievalCode.upsert({
    where: { code: 'CANC-001' },
    update: {},
    create: {
      donationId: DID.cancelled,
      receptorId: null,
      code: 'CANC-001',
      type: CodeType.INDIVIDUAL,
      status: RetrievalCodeStatus.CANCELLED,
      portions: 1,
      expiresAt: days(-1),
    },
  })

  // Edge case: código FAMILY (ONG redistribui para família grande)
  await prisma.retrievalCode.upsert({
    where: { code: 'FAM-001' },
    update: {},
    create: {
      donationId: DID.reserved,
      receptorId: UID.ong,
      code: 'FAM-001',
      type: CodeType.FAMILY,
      status: RetrievalCodeStatus.ACTIVE,
      portions: 4,
      expiresAt: days(1),
    },
  })

  // ==========================================================================
  // NÍVEL 2 — BannerCampaigns (7 registros: 6 status + extra, 3 tipos, 3 posições)
  // ==========================================================================

  const bannerPaidActive = await prisma.bannerCampaign.upsert({
    where: { id: BID.paidActive },
    update: {},
    create: {
      id: BID.paidActive,
      title: 'Empresa Solidária — Campanha Verão',
      type: BannerType.PAID,
      advertiserId: UID.patrocinador,
      imageUrl: 'https://picsum.photos/seed/banner-verão/1200/300',
      linkUrl: 'https://example.com/empresa-solidaria',
      position: BannerPosition.TOP,
      status: BannerStatus.ACTIVE,
      priority: 10,
      startDate: days(-7),
      endDate: days(23),
      impressions: 1420,
      clicks: 38,
    },
  })

  await prisma.bannerCampaign.upsert({
    where: { id: BID.freeRest },
    update: {},
    create: {
      id: BID.freeRest,
      title: 'Bom Sabor — Venha nos conhecer',
      type: BannerType.FREE_RESTAURANT,
      advertiserId: UID.doadorRest,
      imageUrl: 'https://picsum.photos/seed/banner-rest/400/300',
      linkUrl: 'https://example.com/bom-sabor',
      position: BannerPosition.SIDEBAR,
      status: BannerStatus.ACTIVE,
      priority: 50,
      startDate: days(-3),
      endDate: days(4),
      impressions: 380,
      clicks: 12,
    },
  })

  await prisma.bannerCampaign.upsert({
    where: { id: BID.permuta },
    update: {},
    create: {
      id: BID.permuta,
      title: 'Parceria Permuta — Orgânicos do Campo',
      type: BannerType.PERMUTA,
      advertiserId: null,
      imageUrl: 'https://picsum.photos/seed/banner-permuta/800/200',
      permutaPartnerUrl: 'https://example.com/organicos-do-campo',
      position: BannerPosition.INLINE,
      status: BannerStatus.SCHEDULED,
      priority: 80,
      startDate: days(5),
      endDate: days(35),
    },
  })

  await prisma.bannerCampaign.upsert({
    where: { id: BID.draft },
    update: {},
    create: {
      id: BID.draft,
      title: 'Nova Campanha Inverno (Rascunho)',
      type: BannerType.PAID,
      advertiserId: UID.patrocinador,
      imageUrl: 'https://picsum.photos/seed/banner-draft/1200/300',
      position: BannerPosition.TOP,
      status: BannerStatus.DRAFT,
    },
  })

  await prisma.bannerCampaign.upsert({
    where: { id: BID.paused },
    update: {},
    create: {
      id: BID.paused,
      title: 'Campanha Pausada — Em Revisão',
      type: BannerType.PAID,
      advertiserId: UID.patrocinador,
      imageUrl: 'https://picsum.photos/seed/banner-paused/1200/300',
      position: BannerPosition.TOP,
      status: BannerStatus.PAUSED,
      startDate: days(-10),
      endDate: days(20),
      impressions: 500,
      clicks: 5,
    },
  })

  await prisma.bannerCampaign.upsert({
    where: { id: BID.completed },
    update: {},
    create: {
      id: BID.completed,
      title: 'Campanha Concluída — Natal 2025',
      type: BannerType.PAID,
      advertiserId: UID.patrocinador,
      imageUrl: 'https://picsum.photos/seed/banner-natal/1200/300',
      position: BannerPosition.TOP,
      status: BannerStatus.COMPLETED,
      startDate: days(-40),
      endDate: days(-10),
      impressions: 8900,
      clicks: 210,
    },
  })

  // Edge case: banner rejeitado pelo admin (estado de erro)
  await prisma.bannerCampaign.upsert({
    where: { id: BID.rejected },
    update: {},
    create: {
      id: BID.rejected,
      title: 'Banner Rejeitado — Conteúdo Inadequado',
      type: BannerType.PAID,
      advertiserId: UID.patrocinador,
      imageUrl: 'https://picsum.photos/seed/banner-rejected/1200/300',
      position: BannerPosition.TOP,
      status: BannerStatus.REJECTED,
      internalNote: 'Imagem com texto em inglês — fora do padrão editorial do Prato Solidário.',
    },
  })

  // ==========================================================================
  // NÍVEL 3 — BannerCreditHistory (EARNED, USED, EXPIRED)
  // ==========================================================================

  await prisma.bannerCreditHistory.createMany({
    data: [
      // Restaurante ganhou 7 dias por realizar doações
      { creditId: bannerCredit.id, type: BannerCreditType.EARNED, days: 7 },
      // Usou 2 dias para veicular campanha
      { creditId: bannerCredit.id, type: BannerCreditType.USED, days: 2, campaignId: BID.freeRest },
      // 1 dia expirou sem uso
      { creditId: bannerCredit.id, type: BannerCreditType.EXPIRED, days: 1 },
    ],
    skipDuplicates: false, // append-only — usar db:reset para limpar
  })

  // ==========================================================================
  // NÍVEL 2 — SponsorPurchases (5 compras: 4 status × 3 métodos + guest)
  // ==========================================================================

  const purchasePixApproved = await prisma.sponsorPurchase.upsert({
    where: { id: PID.pixApproved },
    update: {},
    create: {
      id: PID.pixApproved,
      sponsorId: sponsorProfile.id,
      marmitariaId: marmProfile1.id,
      quantity: 10,
      unitPrice: 18.90,
      totalAmount: 189.00,
      paymentMethod: PaymentMethod.PIX,
      paymentStatus: PurchaseStatus.APPROVED,
      mpPaymentId: 'MP_PAY_PIX_001',
    },
  })

  await prisma.sponsorPurchase.upsert({
    where: { id: PID.ccPending },
    update: {},
    create: {
      id: PID.ccPending,
      sponsorId: sponsorProfile.id,
      marmitariaId: marmProfile1.id,
      quantity: 5,
      unitPrice: 18.90,
      totalAmount: 94.50,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentStatus: PurchaseStatus.PENDING,
    },
  })

  // Edge case: pagamento rejeitado (estado de erro — cartão recusado)
  await prisma.sponsorPurchase.upsert({
    where: { id: PID.debitRejected },
    update: {},
    create: {
      id: PID.debitRejected,
      sponsorId: sponsorProfile.id,
      marmitariaId: marmProfile1.id,
      quantity: 20,
      unitPrice: 18.90,
      totalAmount: 378.00,
      paymentMethod: PaymentMethod.DEBIT_CARD,
      paymentStatus: PurchaseStatus.REJECTED,
    },
  })

  // Edge case: guest checkout (sem conta — sponsorId null)
  await prisma.sponsorPurchase.upsert({
    where: { id: PID.guestPix },
    update: {},
    create: {
      id: PID.guestPix,
      sponsorId: null,
      guestEmail: 'visitante-generoso+seed@example.com',
      marmitariaId: marmProfile1.id,
      quantity: 3,
      unitPrice: 18.90,
      totalAmount: 56.70,
      paymentMethod: PaymentMethod.PIX,
      paymentStatus: PurchaseStatus.APPROVED,
      mpPaymentId: 'MP_PAY_GUEST_001',
    },
  })

  // Edge case: reembolso solicitado
  await prisma.sponsorPurchase.upsert({
    where: { id: PID.refunded },
    update: {},
    create: {
      id: PID.refunded,
      sponsorId: sponsorProfile.id,
      marmitariaId: marmProfile1.id,
      quantity: 2,
      unitPrice: 18.90,
      totalAmount: 37.80,
      paymentMethod: PaymentMethod.PIX,
      paymentStatus: PurchaseStatus.REFUNDED,
      mpPaymentId: 'MP_PAY_REFUND_001',
    },
  })

  // ==========================================================================
  // NÍVEL 3 — SponsoredMeals (AVAILABLE, RESERVED, DELIVERED)
  // ==========================================================================

  await prisma.sponsoredMeal.createMany({
    data: [
      {
        id: 'e0000001-0000-0000-0000-000000000001',
        purchaseId: purchasePixApproved.id,
        donationId: DID.sponsored,
        marmitariaId: marmProfile1.id,
        status: SponsoredMealStatus.AVAILABLE,
        expiresAt: null, // sem expiração (INT-100)
      },
      {
        id: 'e0000001-0000-0000-0000-000000000002',
        purchaseId: purchasePixApproved.id,
        donationId: null,
        marmitariaId: marmProfile1.id,
        status: SponsoredMealStatus.RESERVED,
        expiresAt: days(1),
      },
      {
        id: 'e0000001-0000-0000-0000-000000000003',
        purchaseId: purchasePixApproved.id,
        donationId: null,
        marmitariaId: marmProfile1.id,
        status: SponsoredMealStatus.DELIVERED,
        expiresAt: null,
      },
    ],
    skipDuplicates: true,
  })

  // ==========================================================================
  // NÍVEL 1 — AdminActions (todos os 6 tipos)
  // ==========================================================================

  await prisma.adminAction.createMany({
    data: [
      {
        adminId: UID.admin,
        targetId: UID.marmPending,
        action: AdminActionType.APPROVE,
        reason: 'Documentação verificada — CNPJ ativo na Receita Federal.',
      },
      {
        adminId: UID.admin,
        targetId: UID.marmSusp,
        action: AdminActionType.SUSPEND,
        reason: 'Duas reclamações de qualidade recebidas em 7 dias.',
      },
      {
        adminId: UID.admin,
        targetId: UID.recBlocked,
        action: AdminActionType.WARN,
        reason: 'Terceiro no-show consecutivo. Bloqueio aplicado automaticamente.',
      },
      {
        adminId: UID.admin,
        targetId: UID.marmInativa,
        action: AdminActionType.REJECT,
        reason: 'CNPJ encerrado segundo Receita Federal.',
      },
      {
        adminId: UID.admin,
        targetId: UID.recBlocked,
        action: AdminActionType.UNBLOCK,
        reason: 'Período de bloqueio encerrado. Receptor reativado.',
      },
      {
        adminId: UID.admin,
        targetId: UID.marmInativa,
        action: AdminActionType.DELETE,
        reason: 'Remoção solicitada pelo titular (direito LGPD Art. 18, IV).',
      },
    ],
  })

  // ==========================================================================
  // NÍVEL 1 — ConsentLogs (V1 e V2 por usuário)
  // ==========================================================================

  await prisma.consentLog.createMany({
    data: [
      { userId: UID.doadorPf, version: ConsentVersion.V1, ipAddress: '192.168.1.10', acceptedAt: days(-60) },
      { userId: UID.doadorPf, version: ConsentVersion.V2, ipAddress: '192.168.1.10', acceptedAt: days(-5) },
      { userId: UID.doadorRest, version: ConsentVersion.V1, ipAddress: '10.0.0.50', acceptedAt: days(-45) },
      { userId: UID.receptor, version: ConsentVersion.V1, ipAddress: '172.16.0.5', acceptedAt: days(-10) },
      { userId: UID.patrocinador, version: ConsentVersion.V1, ipAddress: '203.0.113.5', acceptedAt: days(-30) },
    ],
  })

  // ==========================================================================
  // NÍVEL 1 — PushTokens (android, ios, web — receptor e doador)
  // ==========================================================================

  await prisma.pushToken.createMany({
    data: [
      {
        userId: UID.receptor,
        deviceId: 'device-android-seed-001',
        token: 'ExponentPushToken[ANDROID-SEED-001]',
        platform: Platform.android,
        isActive: true,
      },
      {
        // Edge case: token inativo (dispositivo trocado)
        userId: UID.receptor,
        deviceId: 'device-ios-seed-001',
        token: 'ExponentPushToken[IOS-SEED-001]',
        platform: Platform.ios,
        isActive: false,
      },
      {
        userId: UID.doadorPf,
        deviceId: 'device-web-seed-001',
        token: 'ExponentPushToken[WEB-SEED-001]',
        platform: Platform.web,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  })

  // ==========================================================================
  // NÍVEL 0 — AbuseRecord (IP bloqueado + fingerprint)
  // ==========================================================================

  await prisma.abuseRecord.createMany({
    data: [
      {
        ipAddress: '203.0.113.42',
        fingerprint: 'fp_abc123def456abc1',
        userId: UID.recBlocked,
        blockedUntil: days(2),
        blockCount: 3,
        reason: 'Três no-shows consecutivos — bloqueio progressivo (BlockLevel.THREE_DAYS)',
      },
      {
        // Edge case: IP bloqueado sem userId (usuário anônimo na rota /retirar)
        ipAddress: '198.51.100.10',
        fingerprint: null,
        userId: null,
        blockedUntil: days(1),
        blockCount: 1,
        reason: 'Rate limit excedido na rota /api/v1/retrieval-codes',
      },
    ],
  })

  // ==========================================================================
  // NÍVEL 1 — Badges (todos os 5 tipos — doador ativo com histórico)
  // ==========================================================================

  await prisma.badge.createMany({
    data: [
      { userId: UID.doadorPf, type: BadgeType.PRIMEIRA_DOACAO, month: null, year: yr },
      { userId: UID.doadorPf, type: BadgeType.DOADOR_FREQUENTE, month: mo, year: yr },
      { userId: UID.doadorPf, type: BadgeType.HEROI_DO_MES, month: mo, year: yr },
      { userId: UID.doadorPf, type: BadgeType.CENTURIAO, month: null, year: yr },
      { userId: UID.doadorPf, type: BadgeType.MESTRE, month: null, year: yr },
      // Restaurante — badges iniciais
      { userId: UID.doadorRest, type: BadgeType.PRIMEIRA_DOACAO, month: null, year: yr },
      { userId: UID.doadorRest, type: BadgeType.DOADOR_FREQUENTE, month: mo, year: yr },
    ],
    skipDuplicates: true,
  })

  // ==========================================================================
  // NÍVEL 1 — Diploma (doador com histórico do ano anterior)
  // ==========================================================================

  await prisma.diploma.createMany({
    data: [
      {
        userId: UID.doadorPf,
        year: yr - 1,
        storageUrl: `diplomas/${UID.doadorPf}/${yr - 1}/diploma.pdf`,
        signedUrl: `https://supabase.co/storage/v1/object/sign/diplomas/seed-diploma-${yr - 1}.pdf?token=seed-token`,
        signedUntil: days(90),
      },
    ],
    skipDuplicates: true,
  })

  // ==========================================================================
  // NÍVEL 0 — ImpactMetrics (snapshot inicial da plataforma)
  // ==========================================================================

  await prisma.impactMetrics.create({
    data: {
      totalDonations: 7,
      totalPortions: 90,
      totalReceptors: 2,
      totalDonors: 2,
      totalMarmitarias: 1,
      totalSponsored: 13,
    },
  })

  // ==========================================================================
  // NÍVEL 0 — ProcessedWebhook (idempotência de pagamentos MP)
  // ==========================================================================

  await prisma.processedWebhook.createMany({
    data: [
      { paymentId: 'MP_PAY_PIX_001', provider: 'mercadopago', action: 'payment.approved' },
      { paymentId: 'MP_PAY_GUEST_001', provider: 'mercadopago', action: 'payment.approved' },
      { paymentId: 'MP_PAY_REFUND_001', provider: 'mercadopago', action: 'payment.refunded' },
    ],
    skipDuplicates: true,
  })

  // ==========================================================================
  // Resumo
  // ==========================================================================

  const [users, donations, codes, marms, banners, purchases, meals, badges] =
    await Promise.all([
      prisma.user.count(),
      prisma.donation.count(),
      prisma.retrievalCode.count(),
      prisma.marmitariaProfile.count(),
      prisma.bannerCampaign.count(),
      prisma.sponsorPurchase.count(),
      prisma.sponsoredMeal.count(),
      prisma.badge.count(),
    ])

  console.log('\nSeed concluído.')
  console.log(`  Usuários:            ${users}  (7 roles + edge cases)`)
  console.log(`  Doações:             ${donations}  (6 status × 2 tipos)`)
  console.log(`  Códigos de retirada: ${codes}  (4 status + FAMILY)`)
  console.log(`  Marmitarias:         ${marms}  (4 status)`)
  console.log(`  Banners:             ${banners}  (6 status × 3 tipos)`)
  console.log(`  Compras patrocínio:  ${purchases}  (4 status + guest)`)
  console.log(`  Marmitas patrocin.:  ${meals}  (AVAILABLE/RESERVED/DELIVERED)`)
  console.log(`  Badges:              ${badges}  (5 tipos)`)
  console.log('\nNOTA: Para autenticação, crie os usuários também no Supabase Auth.')
  console.log('      E-mails padrão: <role>+seed@example.com')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
