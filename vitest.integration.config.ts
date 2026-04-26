import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Configuração Vitest para testes de integração — Prato Solidário
 *
 * Testa stack completo: route handler → service → repository → PostgreSQL real.
 * Supabase Auth é mockado (serviço externo). Prisma usa DATABASE_URL_TEST.
 *
 * Executar: npm run test:integration
 * Pré-requisito: DATABASE_URL_TEST apontando para banco de teste com migrations aplicadas.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['tests/integration/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Sequencial — testes de integração compartilham banco, não paralelizar
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    env: {
      DATABASE_URL: process.env.DATABASE_URL_TEST ?? '',
      NODE_ENV: 'test',
      // Supabase values — não usados em testes (mockado), mas necessários para não crashar env.ts
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
