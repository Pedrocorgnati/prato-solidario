/**
 * a11y-audit — script CLI que executa axe-core contra rotas chave
 * e grava um relatorio JSON em reports/a11y/.
 *
 * Pre-requisito: app rodando (pnpm dev) em BASE_URL (default http://localhost:3000).
 *
 * Uso:
 *   pnpm exec tsx scripts/a11y-audit.ts
 *   BASE_URL=https://staging.prato-solidario.app pnpm exec tsx scripts/a11y-audit.ts
 *
 * @see intake-review/TASK-4/ST001 (CL-334, CL-335, CL-336)
 */

import { chromium, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'

const ROUTES: ReadonlyArray<{ name: string; path: string }> = [
  { name: 'landing', path: '/' },
  { name: 'cadastro-hub', path: '/cadastro' },
  { name: 'cadastro-doador', path: '/cadastro/doador' },
  { name: 'retirar', path: '/retirar' },
  { name: 'login', path: '/entrar' },
]

interface RouteReport {
  name: string
  url: string
  violations: number
  critical: number
  serious: number
  moderate: number
  minor: number
  ids: string[]
}

async function auditRoute(page: Page, name: string, routePath: string): Promise<RouteReport> {
  const url = `${BASE_URL}${routePath}`
  await page.goto(url, { waitUntil: 'networkidle' })
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  const by = { critical: 0, serious: 0, moderate: 0, minor: 0 }
  for (const v of results.violations) {
    const impact = v.impact ?? 'minor'
    if (impact in by) by[impact as keyof typeof by]++
  }

  return {
    name,
    url,
    violations: results.violations.length,
    critical: by.critical,
    serious: by.serious,
    moderate: by.moderate,
    minor: by.minor,
    ids: results.violations.map((v) => v.id),
  }
}

async function main() {
  const startedAt = new Date().toISOString()
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  const reports: RouteReport[] = []
  for (const route of ROUTES) {
    try {
      console.log(`auditing ${route.path} ...`)
      const r = await auditRoute(page, route.name, route.path)
      reports.push(r)
      console.log(
        `  violations: ${r.violations} (critical=${r.critical}, serious=${r.serious})`,
      )
    } catch (err) {
      console.error(`  failed: ${String(err)}`)
      reports.push({
        name: route.name,
        url: `${BASE_URL}${route.path}`,
        violations: -1,
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0,
        ids: [`__error__:${String(err)}`],
      })
    }
  }

  await browser.close()

  const outDir = path.join(process.cwd(), 'reports', 'a11y')
  mkdirSync(outDir, { recursive: true })
  const stamp = startedAt.replace(/[:.]/g, '-')
  const outFile = path.join(outDir, `axe-${stamp}.json`)
  writeFileSync(
    outFile,
    JSON.stringify(
      {
        startedAt,
        baseUrl: BASE_URL,
        routes: reports,
        summary: {
          total: reports.length,
          criticalRoutes: reports.filter((r) => r.critical > 0).length,
          seriousRoutes: reports.filter((r) => r.serious > 0).length,
        },
      },
      null,
      2,
    ),
  )
  console.log(`\nrelatorio: ${outFile}`)

  const hardFails = reports.filter((r) => r.critical + r.serious > 0)
  if (hardFails.length > 0) {
    console.error(`\n${hardFails.length} rotas com violacoes critical/serious.`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
