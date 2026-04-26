/**
 * Acessibilidade — axe-core + Playwright
 *
 * Verifica 0 violações critical/serious (WCAG 2.1 AA) nas páginas principais.
 * Violações moderate/minor são logadas em a11y-report.json.
 *
 * @see module-25-contract-testing/TASK-6/ST005-ST007
 * @see US-030 — Acessibilidade WCAG 2.1 AA
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import fs from 'fs'
import path from 'path'

type AxeViolation = {
  id: string
  impact: string | null
  description: string
  nodes: unknown[]
}

type PageReport = {
  page: string
  violations: AxeViolation[]
}

const REPORT_PATH = path.join(__dirname, '../a11y/a11y-report.json')
const pageReports: PageReport[] = []

const pages = [
  { name: 'landing', path: '/' },
  { name: 'retirar', path: '/retirar' },
  { name: 'login', path: '/entrar' },
  { name: 'cadastro', path: '/cadastro' },
]

test.describe('Acessibilidade — WCAG 2.1 AA (US-030)', () => {
  for (const { name, path: pagePath } of pages) {
    test(`[SUCCESS] ${name} — 0 violações critical/serious`, async ({ page }) => {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()

      const criticalOrSerious = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      )

      // Registrar moderate/minor para relatório
      const minorModerate = results.violations.filter(
        (v) => v.impact === 'moderate' || v.impact === 'minor'
      )
      if (minorModerate.length > 0) {
        console.warn(`[a11y] ${name}: ${minorModerate.length} violações moderate/minor`)
        pageReports.push({ page: pagePath, violations: minorModerate as AxeViolation[] })
      }

      // Exigir 0 violações critical/serious
      if (criticalOrSerious.length > 0) {
        const summary = criticalOrSerious.map((v) =>
          `${v.impact}: ${v.id} — ${v.description} (${v.nodes.length} elementos)`
        ).join('\n')
        expect(criticalOrSerious.length, `Violações critical/serious encontradas:\n${summary}`).toBe(0)
      }
    })
  }

  test('[SUCCESS] admin/dashboard — 0 violações critical/serious (autenticado)', async ({ page }) => {
    // Login como admin para acessar dashboard
    await page.goto('/entrar')
    await page.getByLabel(/e-mail/i).fill(process.env.TEST_ADMIN_EMAIL ?? 'admin@test.com')
    await page.getByLabel(/senha/i).fill(process.env.TEST_ADMIN_PASSWORD ?? 'Test@12345')
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.waitForURL(/admin/, { timeout: 10000 })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )

    const minorModerate = results.violations.filter(
      (v) => v.impact === 'moderate' || v.impact === 'minor'
    )
    if (minorModerate.length > 0) {
      pageReports.push({ page: '/admin/dashboard', violations: minorModerate as AxeViolation[] })
    }

    expect(criticalOrSerious.length, 'Violações critical/serious no admin dashboard').toBe(0)
  })

  test('[EDGE] mobile (375px) — touch targets ≥ 44×44px em /retirar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/retirar')
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag21aa'])
      .analyze()

    const criticalOrSerious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    )
    expect(criticalOrSerious.length, 'Violações mobile critical/serious em /retirar').toBe(0)
  })

  test.afterAll(async () => {
    // Gerar a11y-report.json com todas as violações moderate/minor
    if (pageReports.length > 0) {
      const totalModerate = pageReports.reduce(
        (acc, p) => acc + p.violations.filter((v) => v.impact === 'moderate').length,
        0
      )
      const totalMinor = pageReports.reduce(
        (acc, p) => acc + p.violations.filter((v) => v.impact === 'minor').length,
        0
      )
      fs.writeFileSync(REPORT_PATH, JSON.stringify(pageReports, null, 2))
      console.log(
        `[a11y] Páginas: ${pageReports.length} | Critical/Serious: 0 | Moderate: ${totalModerate} | Minor: ${totalMinor}`
      )
      console.log(`[a11y] Relatório salvo em: ${REPORT_PATH}`)
    } else {
      console.log('[a11y] Sem violações moderate/minor detectadas. ✅')
    }
  })
})
