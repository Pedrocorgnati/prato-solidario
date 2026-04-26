/**
 * Helper de scans WCAG AA com axe-core/playwright.
 * @see intake-review/TASK-4/ST001 — CL-298/CL-301
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

export async function scanWcagAa(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  return results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))
}
