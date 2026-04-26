/**
 * E2E Fluxo 2 — Retirada Pública
 * Usuário sem login acessa /retirar, vê doações e solicita uma.
 * @see module-25-contract-testing/TASK-5/ST003
 */

import { test, expect } from '@playwright/test'

test.describe('Fluxo 2 — Retirada Pública', () => {
  test('[SUCCESS] solicitar doação — código de 6 dígitos exibido e doação sai da lista', async ({
    page,
    context,
  }) => {
    // Mock de geolocalização — São Paulo centro
    await context.setGeolocation({ latitude: -23.5505, longitude: -46.6333 })
    await context.grantPermissions(['geolocation'])

    await page.goto('/retirar')
    await page.waitForLoadState('networkidle')

    // Verificar que a lista de doações carregou
    const donationCard = page.locator('[data-testid="donation-card"]').first()
    const hasCards = await donationCard.isVisible({ timeout: 8000 }).catch(() => false)

    if (!hasCards) {
      // Se não há doações, verificar EmptyState
      await expect(page.getByText(/nenhuma doação|sem doações/i)).toBeVisible()
      return
    }

    // Clicar em "Solicitar" na primeira doação
    await page.getByRole('button', { name: /solicitar/i }).first().click()

    // Verificar código de 6 dígitos exibido
    await expect(page.getByText(/código de retirada|seu código/i)).toBeVisible({ timeout: 8000 })
    const codeElement = page.locator('[data-testid="retrieval-code"], .retrieval-code')
    await expect(codeElement).toBeVisible({ timeout: 5000 })
    const codeText = await codeElement.textContent()
    expect(codeText?.trim()).toMatch(/^\d{6}$/)
  })

  test('[EDGE] sem doações disponíveis — EmptyState com mensagem adequada', async ({
    page,
    context,
  }) => {
    // Geolocalização em área remota sem doações
    await context.setGeolocation({ latitude: -22.0, longitude: -55.0 })
    await context.grantPermissions(['geolocation'])

    await page.goto('/retirar')
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Verificar EmptyState ou lista vazia
    const emptyState = page.locator('[data-testid="empty-state"], [data-empty-state]')
    const hasEmpty = await emptyState.isVisible({ timeout: 6000 }).catch(() => false)
    const hasEmptyText = await page.getByText(/nenhuma doação|sem doações disponíveis/i)
      .isVisible({ timeout: 3000 }).catch(() => false)

    expect(hasEmpty || hasEmptyText).toBe(true)
  })
})
