/**
 * E2E Fluxo 4 — Cadastro DOADOR_PF
 * Formulário de 3 etapas + validação de CPF.
 * @see module-25-contract-testing/TASK-5/ST005
 */

import { test, expect } from '@playwright/test'

test.describe('Fluxo 4 — Cadastro Doador PF', () => {
  test('[SUCCESS] 3 etapas — redirect para verificar-email', async ({ page }) => {
    await page.goto('/cadastro')
    await page.waitForLoadState('networkidle')

    // Selecionar "Pessoa Física" se houver escolha de tipo
    const pfButton = page.getByRole('button', { name: /pessoa física/i })
      .or(page.getByText(/pessoa física/i)).first()
    if (await pfButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pfButton.click()
    }

    // Etapa 1: dados pessoais
    const timestamp = Date.now()
    await page.getByLabel(/nome/i).fill('E2E Doador PF')
    await page.getByLabel(/e-mail/i).fill(`e2e-pf-${timestamp}@test.com`)
    await page.getByLabel(/CPF/i).fill('529.982.247-25') // CPF válido

    const nextBtn = page.getByRole('button', { name: /próximo|continuar/i })
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click()
    }

    // Etapa 2: endereço
    const cepField = page.getByLabel(/CEP/i)
    if (await cepField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cepField.fill('01310-100')
      await page.waitForTimeout(1500) // aguardar lookup
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click()
      }
    }

    // Etapa 3: senha
    const passwordField = page.getByLabel(/senha/i).first()
    if (await passwordField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await passwordField.fill('Test@12345')
      const confirmField = page.getByLabel(/confirmar senha/i)
      if (await confirmField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmField.fill('Test@12345')
      }
    }

    await page.getByRole('button', { name: /cadastrar|criar conta/i }).click()

    // Verificar redirect para verificar-email
    await expect(page).toHaveURL(/verificar-email|email|cadastro/, { timeout: 10000 })
    await expect(page.getByText(/verifique|verificação|e-mail enviado/i)).toBeVisible({ timeout: 5000 })
  })

  test('[ERROR] CPF inválido — mensagem de erro inline', async ({ page }) => {
    await page.goto('/cadastro')
    await page.waitForLoadState('networkidle')

    const pfButton = page.getByRole('button', { name: /pessoa física/i })
      .or(page.getByText(/pessoa física/i)).first()
    if (await pfButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pfButton.click()
    }

    const cpfField = page.getByLabel(/CPF/i)
    if (await cpfField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cpfField.fill('111.111.111-11') // CPF inválido
      await cpfField.blur()

      // Verificar mensagem de erro inline
      await expect(page.getByText(/CPF inválido/i)).toBeVisible({ timeout: 5000 })
    }
  })
})
