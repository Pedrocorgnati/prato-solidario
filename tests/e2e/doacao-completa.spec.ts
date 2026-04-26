/**
 * E2E Fluxo 1 — Doação Completa
 * DOADOR_RESTAURANTE cria uma doação e a vê na lista com status PENDING.
 * @see module-25-contract-testing/TASK-5/ST002
 */

import { test, expect } from '@playwright/test'

test.describe('Fluxo 1 — Doação Completa', () => {
  test.beforeEach(async ({ page }) => {
    // Login como DOADOR_RESTAURANTE via credenciais de teste
    await page.goto('/entrar')
    await page.getByLabel(/e-mail/i).fill(process.env.TEST_DONOR_EMAIL ?? 'doador-restaurante@test.com')
    await page.getByLabel(/senha/i).fill(process.env.TEST_DONOR_PASSWORD ?? 'Test@12345')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
  })

  test('[SUCCESS] preenche formulário e doação aparece na lista com status PENDING', async ({ page }) => {
    await page.goto('/doar')
    await page.waitForLoadState('networkidle')

    await page.getByLabel(/título/i).fill('Marmitas E2E Teste')
    await page.getByLabel(/descrição/i).fill('Descrição E2E — marmitas de frango')
    await page.getByLabel(/quantidade/i).fill('5')
    await page.getByLabel(/CEP/i).fill('01310-100')
    await page.waitForTimeout(1000) // aguardar lookup de CEP

    // Selecionar janela de retirada
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    await page.getByLabel(/data/i).first().fill(tomorrowStr)

    await page.getByRole('button', { name: /criar doação|publicar/i }).click()

    // Verificar redirect e toast de sucesso
    await expect(page.getByRole('status')).toContainText(/doação criada|sucesso/i, { timeout: 8000 })

    // Verificar que a doação aparece na lista
    await page.goto('/dashboard/minhas-doacoes')
    await expect(page.getByText('Marmitas E2E Teste')).toBeVisible({ timeout: 8000 })
  })

  test('[ERROR] submeter sem CEP — mensagem de erro inline no campo CEP', async ({ page }) => {
    await page.goto('/doar')
    await page.getByLabel(/título/i).fill('E2E sem CEP')
    await page.getByLabel(/descrição/i).fill('Descrição sem CEP')
    await page.getByLabel(/quantidade/i).fill('3')
    // Deixar CEP em branco
    await page.getByRole('button', { name: /criar doação|publicar/i }).click()

    // Verificar erro inline no campo CEP
    await expect(page.locator('[aria-describedby*="cep"], [data-error*="cep"], .error-cep, [id*="cep-error"]'))
      .toBeVisible({ timeout: 5000 })
  })
})
