/**
 * E2E Fluxo 6 — Login por Roles
 * Verifica que cada role redireciona para a URL correta após login.
 * @see module-25-contract-testing/TASK-5/ST007
 */

import { test, expect } from '@playwright/test'

const roleRedirects = [
  {
    role: 'DOADOR_RESTAURANTE',
    email: process.env.TEST_DONOR_EMAIL ?? 'doador-restaurante@test.com',
    password: process.env.TEST_DONOR_PASSWORD ?? 'Test@12345',
    expectedUrl: /dashboard/,
  },
  {
    role: 'ONG',
    email: process.env.TEST_ONG_EMAIL ?? 'ong@test.com',
    password: process.env.TEST_ONG_PASSWORD ?? 'Test@12345',
    expectedUrl: /ong|dashboard/,
  },
  {
    role: 'MARMITARIA',
    email: process.env.TEST_MARMITARIA_EMAIL ?? 'marmitaria@test.com',
    password: process.env.TEST_MARMITARIA_PASSWORD ?? 'Test@12345',
    expectedUrl: /marmitaria|painel|dashboard/,
  },
  {
    role: 'PATROCINADOR',
    email: process.env.TEST_SPONSOR_EMAIL ?? 'patrocinador@test.com',
    password: process.env.TEST_SPONSOR_PASSWORD ?? 'Test@12345',
    expectedUrl: /patrocinador|dashboard/,
  },
  {
    role: 'ADMIN',
    email: process.env.TEST_ADMIN_EMAIL ?? 'admin@test.com',
    password: process.env.TEST_ADMIN_PASSWORD ?? 'Test@12345',
    expectedUrl: /admin/,
  },
]

test.describe('Fluxo 6 — Login por Roles', () => {
  for (const { role, email, password, expectedUrl } of roleRedirects) {
    test(`[SUCCESS] ${role} → redirect para URL correta`, async ({ page }) => {
      await page.goto('/entrar')
      await page.getByLabel(/e-mail/i).fill(email)
      await page.getByLabel(/senha/i).fill(password)
      await page.getByRole('button', { name: /entrar/i }).click()

      await expect(page).toHaveURL(expectedUrl, { timeout: 10000 })
    })
  }

  test('[SECURITY] DOADOR_RESTAURANTE não acessa /admin — redirect para /acesso-negado ou /dashboard', async ({
    page,
  }) => {
    // Login como DOADOR_RESTAURANTE
    await page.goto('/entrar')
    await page.getByLabel(/e-mail/i).fill(process.env.TEST_DONOR_EMAIL ?? 'doador-restaurante@test.com')
    await page.getByLabel(/senha/i).fill(process.env.TEST_DONOR_PASSWORD ?? 'Test@12345')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })

    // Tentar navegar para /admin
    await page.goto('/admin')
    await expect(page).not.toHaveURL(/\/admin$/, { timeout: 5000 })
    // Deve estar em /acesso-negado ou /dashboard
    await expect(page).toHaveURL(/acesso-negado|dashboard|\/entrar/, { timeout: 5000 })
  })
})
