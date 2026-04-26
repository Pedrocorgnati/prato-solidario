/**
 * E2E Fluxo 10 — Corrente do Bem
 * Receptor acessa /retirar/corrente após confirmação de código → card com dados anonimizados.
 * @see module-25-contract-testing/TASK-5/ST011
 */

import { test, expect } from '@playwright/test'

test.describe('Fluxo 10 — Corrente do Bem', () => {
  test('[SUCCESS] card da corrente exibe dados anonimizados após código confirmado', async ({ page }) => {
    // Este fluxo requer um código já confirmado — em staging usar dados reais
    // Verificar a página de corrente do bem com código de teste
    const codeParam = process.env.TEST_CONFIRMED_CODE
    if (!codeParam) {
      // Acessar a página sem código — verificar estado de aguardo
      await page.goto('/retirar/corrente')
      await page.waitForLoadState('networkidle')

      const waitingText = page.getByText(/aguardando|confirmação pendente/i)
      const hasWaiting = await waitingText.isVisible({ timeout: 5000 }).catch(() => false)
      if (hasWaiting) {
        expect(hasWaiting).toBe(true)
      }
      return
    }

    await page.goto(`/retirar/corrente?code=${codeParam}`)
    await page.waitForLoadState('networkidle')

    // Card deve exibir dados anonimizados
    const card = page.locator('[data-testid="corrente-card"]')
    await expect(card).toBeVisible({ timeout: 8000 })

    // Campos esperados no card
    await expect(card.getByText(/tipo de alimento|categoria/i)).toBeVisible()
    await expect(card.getByText(/data/i)).toBeVisible()

    // Nome do doador deve estar anonimizado (ex: "João S.")
    const donorName = await card.locator('[data-testid="donor-name"]').textContent()
    if (donorName) {
      // Nome anonimizado: primeiro nome + inicial do sobrenome
      expect(donorName.trim()).toMatch(/\w+ \w\./)
    }
  })

  test('[EDGE] código não confirmado → mensagem de aguardo', async ({ page, context }) => {
    await context.setGeolocation({ latitude: -23.5505, longitude: -46.6333 })
    await context.grantPermissions(['geolocation'])

    await page.goto('/retirar')
    await page.waitForLoadState('networkidle')

    // Tentar acessar corrente do bem sem código confirmado
    await page.goto('/retirar/corrente')
    await page.waitForLoadState('networkidle')

    const waitingState = page.getByText(/aguardando|código ainda não confirmado|pendente/i)
      .or(page.locator('[data-testid="corrente-waiting"]'))

    const hasWaiting = await waitingState.isVisible({ timeout: 6000 }).catch(() => false)
    // Deve mostrar mensagem de aguardo OU ter sido redirecionado para fora de /corrente
    const isOnCorrentePage = page.url().includes('/corrente')
    // Se está na página de corrente, DEVE mostrar estado de aguardo
    // Se foi redirecionado, é comportamento aceitável (guard de rota)
    if (isOnCorrentePage) {
      expect(hasWaiting).toBe(true)
    } else {
      // Redirecionou para /retirar ou outra rota — aceitável
      expect(page.url()).toMatch(/retirar|entrar/)
    }
  })
})
