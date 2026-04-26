/**
 * Visual Regression — Playwright Screenshots
 *
 * Captura screenshots de sections críticas e compara com baseline.
 * Primeiro run: cria baseline em tests/visual/baseline/.
 * Runs subsequentes: falha se diff > 0.5%.
 *
 * @see module-25-contract-testing/TASK-7/ST003-ST004
 */

import { test, expect } from '@playwright/test'

const SNAPSHOT_OPTIONS = {
  maxDiffPixelRatio: 0.005, // 0.5% de tolerância
  animations: 'disabled' as const,
}

test.describe('Visual Regression — Páginas Críticas', () => {
  test('landing page — hero section', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Aguardar carregamento de imagens
    await page.waitForTimeout(1000)
    // Esconder elementos dinâmicos (contadores em tempo real)
    await page.evaluate(() => {
      document.querySelectorAll('[data-testid="impact-counter"], [data-dynamic]').forEach((el) => {
        ;(el as HTMLElement).style.visibility = 'hidden'
      })
    })
    const screenshot = await page.screenshot({
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    })
    expect(screenshot).toMatchSnapshot('landing-hero.png', SNAPSHOT_OPTIONS)
  })

  test('retirar — formulário de solicitar', async ({ page, context }) => {
    await context.setGeolocation({ latitude: -23.5505, longitude: -46.6333 })
    await context.grantPermissions(['geolocation'])
    await page.goto('/retirar')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    const screenshot = await page.screenshot({
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    })
    expect(screenshot).toMatchSnapshot('retirar-form.png', SNAPSHOT_OPTIONS)
  })

  test('login — card de login', async ({ page }) => {
    await page.goto('/entrar')
    await page.waitForLoadState('networkidle')
    const screenshot = await page.screenshot({
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    })
    expect(screenshot).toMatchSnapshot('login-card.png', SNAPSHOT_OPTIONS)
  })

  test('admin dashboard — grid de marmitarias (autenticado)', async ({ page }) => {
    await page.goto('/entrar')
    await page.getByLabel(/e-mail/i).fill(process.env.TEST_ADMIN_EMAIL ?? 'admin@test.com')
    await page.getByLabel(/senha/i).fill(process.env.TEST_ADMIN_PASSWORD ?? 'Test@12345')
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.waitForURL(/admin/, { timeout: 10000 })
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    const screenshot = await page.screenshot({
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    })
    expect(screenshot).toMatchSnapshot('admin-dashboard.png', SNAPSHOT_OPTIONS)
  })
})
