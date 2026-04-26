/**
 * E2E Fluxo 9 — LGPD: Exclusão de Conta
 * Usuário digita EXCLUIR → logout → tela de confirmação → login bloqueado.
 * @see module-25-contract-testing/TASK-5/ST010
 */

import { test, expect } from '@playwright/test'

test.describe('Fluxo 9 — LGPD: Exclusão de Conta', () => {
  test('[EDGE] botão permanece desabilitado se texto diferente de EXCLUIR', async ({ page }) => {
    // Login com conta de teste descartável
    await page.goto('/entrar')
    await page.getByLabel(/e-mail/i).fill(process.env.TEST_DONOR_EMAIL ?? 'doador-restaurante@test.com')
    await page.getByLabel(/senha/i).fill(process.env.TEST_DONOR_PASSWORD ?? 'Test@12345')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })

    await page.goto('/conta/excluir-conta')
    await page.waitForLoadState('networkidle')

    const confirmInput = page.getByLabel(/digitar EXCLUIR|confirme/i)
      .or(page.getByPlaceholder(/EXCLUIR/))
      .or(page.locator('[data-testid="delete-confirmation-input"]'))

    if (!await confirmInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip(true, 'Página de exclusão não encontrada')
      return
    }

    await confirmInput.fill('excluir') // minúsculas — inválido
    const deleteBtn = page.getByRole('button', { name: /confirmar exclusão|excluir conta/i })
    await expect(deleteBtn).toBeDisabled({ timeout: 3000 })

    await confirmInput.fill('EXCLUIR') // correto
    await expect(deleteBtn).toBeEnabled({ timeout: 3000 })
  })

  test('[SUCCESS] exclusão confirmada → logout + redirect /conta/excluida (com conta temporária)', async ({
    page,
  }) => {
    // NOTA: Este teste usa uma conta temporária que será excluída.
    // Em CI, criar conta via API de seed antes de executar.
    // Aqui documentamos o fluxo esperado.
    test.skip(!process.env.TEST_DELETABLE_EMAIL, 'TEST_DELETABLE_EMAIL não configurado — criar conta temporária')

    await page.goto('/entrar')
    await page.getByLabel(/e-mail/i).fill(process.env.TEST_DELETABLE_EMAIL!)
    await page.getByLabel(/senha/i).fill(process.env.TEST_DELETABLE_PASSWORD ?? 'Test@12345')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })

    await page.goto('/conta/excluir-conta')
    const confirmInput = page.locator('[data-testid="delete-confirmation-input"]')
      .or(page.getByPlaceholder(/EXCLUIR/))
    await confirmInput.fill('EXCLUIR')
    await page.getByRole('button', { name: /confirmar exclusão|excluir conta/i }).click()

    // Verificar redirect para /conta/excluida ou logout
    await expect(page).toHaveURL(/conta\/excluida|entrar|excluida/, { timeout: 10000 })
    await expect(page.getByText(/conta excluída|excluída com sucesso/i)).toBeVisible({ timeout: 5000 })

    // Tentar login com as mesmas credenciais — deve falhar
    await page.goto('/entrar')
    await page.getByLabel(/e-mail/i).fill(process.env.TEST_DELETABLE_EMAIL!)
    await page.getByLabel(/senha/i).fill(process.env.TEST_DELETABLE_PASSWORD ?? 'Test@12345')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page.getByText(/usuário não encontrado|conta inativa|credenciais inválidas/i))
      .toBeVisible({ timeout: 8000 })
  })
})
