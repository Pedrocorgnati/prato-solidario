import { test, expect } from '@playwright/test'
import { scanWcagAa } from './helpers'

test('A11y — cadastro — zero violacoes serious/critical', async ({ page }) => {
  await page.goto('/cadastro')
  const violations = await scanWcagAa(page)
  if (violations.length > 0) {
    console.log('[a11y /cadastro] violations:', JSON.stringify(violations, null, 2))
  }
  expect(violations).toEqual([])
})
