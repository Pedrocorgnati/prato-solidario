import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * Configuração Vitest para testes de contrato (module-25)
 * Usa DATABASE_URL_TEST isolado do banco de produção/staging.
 *
 * Executar: npm run test:contracts
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/contracts/**/*.test.ts'],
    setupFiles: ['tests/contracts/setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL_TEST ?? '',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
