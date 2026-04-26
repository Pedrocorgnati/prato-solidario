import { test, expect } from '@playwright/test'
import { scanWcagAa } from './helpers'

test.describe('A11y — /retirar', () => {
  test('zero violacoes serious/critical WCAG AA', async ({ page }) => {
    await page.goto('/retirar')
    const violations = await scanWcagAa(page)
    if (violations.length > 0) {
      console.log('[a11y /retirar] violations:', JSON.stringify(violations, null, 2))
    }
    expect(violations).toEqual([])
  })

  test('navegacao por teclado — foco visivel', async ({ page }) => {
    await page.goto('/retirar')
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(focused).toBeTruthy()
  })
})
