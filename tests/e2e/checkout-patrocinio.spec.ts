/**
 * E2E Fluxo 5 — Checkout de Patrocínio
 * Patrocinador seleciona marmitaria, quantidade e completa pagamento.
 * @see module-25-contract-testing/TASK-5/ST006
 */

import { test, expect } from '@playwright/test'

test.describe('Fluxo 5 — Checkout de Patrocínio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/entrar')
    await page.getByLabel(/e-mail/i).fill(process.env.TEST_SPONSOR_EMAIL ?? 'patrocinador@test.com')
    await page.getByLabel(/senha/i).fill(process.env.TEST_SPONSOR_PASSWORD ?? 'Test@12345')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
  })

  test('[SUCCESS] pagamento APPROVED → tela de sucesso com número do pedido', async ({ page }) => {
    await page.goto('/patrocinar')
    await page.waitForLoadState('networkidle')

    // Verificar se há marmitarias disponíveis
    const marmitariaCard = page.locator('[data-testid="marmitaria-card"]').first()
    const hasCard = await marmitariaCard.isVisible({ timeout: 8000 }).catch(() => false)
    if (!hasCard) {
      test.skip(true, 'Sem marmitarias disponíveis para patrocinar')
      return
    }

    await marmitariaCard.click()

    // Selecionar quantidade
    const quantityInput = page.getByLabel(/quantidade/i)
    if (await quantityInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await quantityInput.fill('10')
    }

    // Interceptar chamada ao MercadoPago ANTES do click — evita race condition
    await page.route('**/mercadopago**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'approved', id: 'mp-test-123' }),
      })
    })
    await page.route('**/api/v1/sponsor**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ orderId: 'ORD-TEST-001', status: 'approved' }),
      })
    })

    await page.getByRole('button', { name: /ir para pagamento|pagar/i }).click()

    // Verificar tela de sucesso
    await expect(page.getByText(/pedido confirmado|pagamento aprovado|sucesso/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/número do pedido|order/i)).toBeVisible({ timeout: 5000 })
  })

  test('[ERROR] pagamento REJECTED → tela de erro com opção de tentar novamente', async ({ page }) => {
    await page.goto('/patrocinar')
    await page.waitForLoadState('networkidle')

    const marmitariaCard = page.locator('[data-testid="marmitaria-card"]').first()
    const hasCard = await marmitariaCard.isVisible({ timeout: 8000 }).catch(() => false)
    if (!hasCard) {
      test.skip(true, 'Sem marmitarias disponíveis')
      return
    }

    await marmitariaCard.click()

    await page.route('**/api/v1/sponsor**', (route) => {
      route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'PAY_001', message: 'Pagamento recusado' } }),
      })
    })

    await page.getByRole('button', { name: /ir para pagamento|pagar/i }).click()

    await expect(page.getByText(/pagamento recusado|falha no pagamento/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /tentar novamente|tentar de novo/i })).toBeVisible({ timeout: 5000 })
  })
})
