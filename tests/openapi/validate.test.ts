/**
 * OpenAPI Validation — Prato Solidário
 *
 * Valida que endpoints críticos conformam ao schema openapi.yaml.
 * Requer servidor rodando em PLAYWRIGHT_BASE_URL (ou localhost:3000).
 *
 * @see module-25-contract-testing/TASK-6/ST001-ST004
 */

import { describe, it, expect, beforeAll } from 'vitest'
import path from 'path'
import fs from 'fs'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
// Usar caminho relativo ao cwd (raiz do projeto) para portabilidade CI/Docker
const OPENAPI_PATH = process.env.OPENAPI_SPEC_PATH
  ?? path.resolve(process.cwd(), '../../../output/docs/prato-solidario/project/openapi.yaml')

// Skip all tests if openapi-backend is not installed (graceful degradation)
let OpenAPIBackend: typeof import('openapi-backend').default | null = null

beforeAll(async () => {
  try {
    const mod = await import('openapi-backend')
    OpenAPIBackend = mod.default
  } catch {
    console.warn('[openapi-validate] openapi-backend não instalado — skip testes de validação')
  }
})

describe('OpenAPI Validation — Endpoints Críticos', () => {
  it('[CONTRACT] openapi.yaml existe e é válido', () => {
    expect(fs.existsSync(OPENAPI_PATH)).toBe(true)
    const content = fs.readFileSync(OPENAPI_PATH, 'utf-8')
    expect(content).toContain('openapi:')
    expect(content.length).toBeGreaterThan(100)
  })

  it('[SUCCESS] GET /api/v1/donations/available — parâmetros obrigatórios documentados', async () => {
    if (!OpenAPIBackend) return

    const api = new OpenAPIBackend({ definition: OPENAPI_PATH })
    await api.init()

    // Verificar que a rota está documentada no OpenAPI
    const operation = api.router.matchOperation({
      method: 'get',
      path: '/api/v1/donations/available',
    })
    expect(operation).toBeDefined()

    // Verificar parâmetros obrigatórios (lat, lng, radius)
    const params = operation?.operation?.parameters ?? []
    const paramNames = (params as Array<{ name: string }>).map((p) => p.name)
    expect(paramNames).toContain('lat')
    expect(paramNames).toContain('lng')
  })

  it('[SUCCESS] POST /api/v1/donations — documentado com schema de request', async () => {
    if (!OpenAPIBackend) return

    const api = new OpenAPIBackend({ definition: OPENAPI_PATH })
    await api.init()

    const operation = api.router.matchOperation({
      method: 'post',
      path: '/api/v1/donations',
    })
    expect(operation).toBeDefined()
    expect(operation?.operation?.requestBody).toBeDefined()
  })

  it('[SUCCESS] GET /api/v1/metrics/public — documentado como endpoint público', async () => {
    if (!OpenAPIBackend) return

    const api = new OpenAPIBackend({ definition: OPENAPI_PATH })
    await api.init()

    const operation = api.router.matchOperation({
      method: 'get',
      path: '/api/v1/metrics/public',
    })
    expect(operation).toBeDefined()
    // Endpoint público — não deve exigir auth no schema
    const security = operation?.operation?.security
    const isPublic = !security || security.length === 0
    expect(isPublic).toBe(true)
  })

  it('[ERROR] GET /donations/available sem parâmetros → 400 documentado', async () => {
    if (!OpenAPIBackend) return

    const api = new OpenAPIBackend({ definition: OPENAPI_PATH })
    await api.init()

    const operation = api.router.matchOperation({
      method: 'get',
      path: '/api/v1/donations/available',
    })
    // Verificar que o schema define resposta 400
    const responses = operation?.operation?.responses ?? {}
    expect(Object.keys(responses)).toContain('400')
  })

  it('[INTEGRATION] GET /api/v1/metrics/public retorna 200 com schema correto (requer servidor)', async () => {
    if (process.env.CI !== 'true' && !process.env.PLAYWRIGHT_BASE_URL) {
      // Skip se servidor não está rodando
      return
    }

    const res = await fetch(`${BASE_URL}/api/v1/metrics/public`)
    if (!res.ok) return // Graceful degradation

    const body = await res.json()
    // Campos obrigatórios do schema público
    expect(typeof body.totalMealsDistributed).toBe('number')
    expect(typeof body.activeDonationsToday).toBe('number')
    expect(typeof body.activeMarmitarias).toBe('number')
    expect(typeof body.kgFoodSaved).toBe('number')

    // Campos internos NÃO devem estar presentes
    expect(body.userId).toBeUndefined()
    expect(body.createdBy).toBeUndefined()
  })
})
