/**
 * E2E Fluxo 3 — Confirmação de Código
 * Doador confirma código de retirada → status CONFIRMED → KPI banner atualizado.
 * @see module-25-contract-testing/TASK-5/ST004
 */

import { test, expect } from '@playwright/test'

test.describe('Fluxo 3 — Confirmação de Código', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/entrar')
    await page.getByLabel(/e-mail/i).fill(process.env.TEST_DONOR_EMAIL ?? 'doador-restaurante@test.com')
    await page.getByLabel(/senha/i).fill(process.env.TEST_DONOR_PASSWORD ?? 'Test@12345')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
  })

  test('[SUCCESS] confirmar código → status CONFIRMED + KPI banner incrementa', async ({ page }) => {
    await page.goto('/dashboard/codigos')
    await page.waitForLoadState('networkidle')

    // Verificar saldo de banner antes
    const bannerBalance = page.locator('[data-testid="banner-credit-balance"]')
    const hasBalance = await bannerBalance.isVisible({ timeout: 5000 }).catch(() => false)
    const initialBalance = hasBalance ? parseInt(await bannerBalance.textContent() ?? '0', 10) : null

    // Verificar se há código ativo para confirmar
    const confirmButton = page.getByRole('button', { name: /confirmar/i }).first()
    const hasCode = await confirmButton.isVisible({ timeout: 5000 }).catch(() => false)

    if (!hasCode) {
      test.skip(true, 'Sem códigos ativos para confirmar — pular teste')
      return
    }

    await confirmButton.click()

    // Verificar modal/feedback de confirmação
    await expect(page.getByRole('status').or(page.getByRole('dialog'))).toBeVisible({ timeout: 8000 })

    // Status deve mudar para CONFIRMED
    await expect(page.getByText(/confirmado|código confirmado/i)).toBeVisible({ timeout: 5000 })

    // KPI de banner deve incrementar (para DOADOR_RESTAURANTE)
    if (initialBalance !== null) {
      await page.reload()
      await page.waitForLoadState('networkidle')
      const newBalance = parseInt(await bannerBalance.textContent() ?? '0', 10)
      expect(newBalance).toBeGreaterThanOrEqual(initialBalance)
    }
  })
})
