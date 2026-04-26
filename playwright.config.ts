import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright Configuration — Prato Solidário E2E
 *
 * Requer PLAYWRIGHT_BASE_URL configurada em .env.test (staging Vercel ou localhost).
 * @see module-25-contract-testing/TASK-5/ST001
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['iPhone 14'] },
    },
  ],
})
