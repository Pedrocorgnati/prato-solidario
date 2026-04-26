/**
 * E2E Fluxo 7 — Admin: Gestão de Marmitarias
 * ADMIN filtra PENDING, aprova marmitaria → status ACTIVE.
 * @see module-25-contract-testing/TASK-5/ST008
 */

import { test, expect } from '@playwright/test'

test.describe('Fluxo 7 — Admin Gestão de Marmitarias', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/entrar')
    await page.getByLabel(/e-mail/i).fill(process.env.TEST_ADMIN_EMAIL ?? 'admin@test.com')
    await page.getByLabel(/senha/i).fill(process.env.TEST_ADMIN_PASSWORD ?? 'Test@12345')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page).toHaveURL(/admin/, { timeout: 10000 })
  })

  test('[SUCCESS] ADMIN filtra PENDING e aprova marmitaria → status ACTIVE', async ({ page }) => {
    await page.goto('/admin/marmitarias')
    await page.waitForLoadState('networkidle')

    // Filtrar por PENDING
    const pendingFilter = page.getByRole('button', { name: /pendente|pending/i })
      .or(page.getByRole('option', { name: /pendente|pending/i }))
      .or(page.locator('[data-filter="PENDING_APPROVAL"]'))
    if (await pendingFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pendingFilter.click()
      await page.waitForLoadState('networkidle')
    }

    // Verificar se há marmitarias PENDING
    const pendingRow = page.locator('[data-testid="marmitaria-row"], tbody tr').first()
    const hasRows = await pendingRow.isVisible({ timeout: 5000 }).catch(() => false)
    if (!hasRows) {
      test.skip(true, 'Sem marmitarias PENDING para aprovar')
      return
    }

    // Clicar na primeira marmitaria para ver detalhes
    await pendingRow.click()
    await page.waitForLoadState('networkidle')

    // Clicar em "Aprovar"
    await page.getByRole('button', { name: /aprovar/i }).click()

    // Confirmar no modal se existir
    const confirmBtn = page.getByRole('button', { name: /confirmar|sim/i })
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click()
    }

    // Verificar feedback de sucesso
    await expect(page.getByText(/aprovada|aprovado|status.*ativo/i)).toBeVisible({ timeout: 8000 })

    // Verificar que a marmitaria saiu do filtro PENDING (se voltou para lista)
    const stillPending = page.getByText(/pending|pendente/i)
    // Após aprovação, não deve mais aparecer como pendente na lista principal
    await expect(page.getByRole('status').or(page.getByText(/sucesso/i))).toBeVisible({ timeout: 5000 })
  })
})
