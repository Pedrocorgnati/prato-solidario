/**
 * Setup global para testes de integração — Prato Solidário
 *
 * Responsabilidades:
 * - Conectar/desconectar Prisma ao banco de teste
 * - Limpar registros criados nos testes (por domain de e-mail @integration-test.local)
 */

import { afterAll, beforeAll } from 'vitest'
import { prisma } from '@/lib/prisma'

// Domain exclusivo para e-mails criados nos testes de integração
export const TEST_EMAIL_DOMAIN = '@integration-test.local'

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  // Limpar dados criados pelos testes (identificados pelo domain de e-mail)
  // Ordem inversa das FKs para evitar erros de constraint
  await prisma.$transaction([
    prisma.pushToken.deleteMany({
      where: { user: { email: { endsWith: TEST_EMAIL_DOMAIN } } },
    }),
    prisma.address.deleteMany({
      where: { user: { email: { endsWith: TEST_EMAIL_DOMAIN } } },
    }),
    prisma.donorProfile.deleteMany({
      where: { user: { email: { endsWith: TEST_EMAIL_DOMAIN } } },
    }),
    prisma.receptorProfile.deleteMany({
      where: { user: { email: { endsWith: TEST_EMAIL_DOMAIN } } },
    }),
    prisma.marmitariaProfile.deleteMany({
      where: { user: { email: { endsWith: TEST_EMAIL_DOMAIN } } },
    }),
    prisma.ongProfile.deleteMany({
      where: { user: { email: { endsWith: TEST_EMAIL_DOMAIN } } },
    }),
    prisma.sponsorProfile.deleteMany({
      where: { user: { email: { endsWith: TEST_EMAIL_DOMAIN } } },
    }),
    prisma.user.deleteMany({
      where: { email: { endsWith: TEST_EMAIL_DOMAIN } },
    }),
  ])

  await prisma.$disconnect()
})
