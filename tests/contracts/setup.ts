/**
 * Setup compartilhado para testes de contrato (module-25)
 *
 * Valida que DATABASE_URL_TEST está configurada antes de qualquer teste.
 * Cada arquivo de teste usa prisma.$transaction + rollback no afterEach.
 */

import { beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

// Guard: falha imediatamente se banco de teste não estiver configurado
// IMPORTANTE: exige DATABASE_URL_TEST explicitamente para evitar
// execução acidental contra banco de produção/desenvolvimento
if (!process.env.DATABASE_URL_TEST) {
  throw new Error(
    'DATABASE_URL_TEST não configurada — configure .env.test antes de rodar os testes de contrato.\n' +
      'Exemplo: DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/prato_solidario_test\n' +
      'NUNCA use DATABASE_URL diretamente — risco de contaminação cross-environment.'
  )
}

export const prismaTest = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL_TEST,
})

beforeAll(async () => {
  await prismaTest.$connect()
})

afterAll(async () => {
  await prismaTest.$disconnect()
})
