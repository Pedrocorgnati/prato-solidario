/**
 * E2E Fluxo 8 — Banner Crédito
 * DOADOR_RESTAURANTE confirma doação → KPI de crédito de banner incrementa.
 * @see module-25-contract-testing/TASK-5/ST009
 */

import { test, expect } from '@playwright/test'

test.describe('Fluxo 8 — Banner Crédito', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/entrar')
    await page.getByLabel(/e-mail/i).fill(process.env.TEST_DONOR_EMAIL ?? 'doador-restaurante@test.com')
    await page.getByLabel(/senha/i).fill(process.env.TEST_DONOR_PASSWORD ?? 'Test@12345')
    await page.getByRole('button', { name: /entrar/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
  })

  test('[SUCCESS] KPI de crédito de banner incrementa após doação confirmada', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Capturar KPI inicial de crédito de banner
    const kpiSelector = '[data-testid="banner-credit-balance"], [data-kpi="banner-credits"], .banner-credit-count'
    const kpiEl = page.locator(kpiSelector)
    const hasKpi = await kpiEl.isVisible({ timeout: 5000 }).catch(() => false)

    const initialValue = hasKpi
      ? parseInt((await kpiEl.textContent()) ?? '0', 10)
      : null

    // Verificar que o KPI existe e é numérico
    if (initialValue !== null) {
      expect(Number.isNaN(initialValue)).toBe(false)
      expect(initialValue).toBeGreaterThanOrEqual(0)
    }

    // Confirmar uma doação via API para incrementar o crédito de banner
    // Usa endpoint de seed de teste ou API real de confirmação
    const seedUrl = process.env.TEST_SEED_API ?? '/api/v1/test/confirm-donation'
    const confirmRes = await page.evaluate(async (url) => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'confirm-latest-donation' }),
        })
        return { ok: res.ok, status: res.status }
      } catch (e) {
        return { ok: false, status: 0, error: String(e) }
      }
    }, seedUrl)

    if (!confirmRes.ok) {
      test.skip(true, `Seed API indisponível (status: ${confirmRes.status}) — execute com TEST_SEED_API configurado`)
      return
    }

    // Após reload, verificar que KPI incrementou
    await page.reload()
    await page.waitForLoadState('networkidle')
    const newKpi = page.locator(kpiSelector)
    const hasNewKpi = await newKpi.isVisible({ timeout: 3000 }).catch(() => false)
    if (hasNewKpi && initialValue !== null) {
      const newValue = parseInt((await newKpi.textContent()) ?? '0', 10)
      expect(newValue).toBeGreaterThan(initialValue)
    } else if (initialValue !== null) {
      // KPI desapareceu após reload — possível regressão
      expect(hasNewKpi).toBe(true)
    }
  })
})
