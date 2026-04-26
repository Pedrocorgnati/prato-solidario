/**
 * Testes de integração — Push Tokens
 *
 * Cobre: POST /push-tokens, DELETE /push-tokens/{token}, GET /users/me/push-tokens
 * Banco real via Prisma. Tokens criados são limpos no afterEach.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server'
import { buildAdminClient, buildServerClient } from './helpers/mock-supabase'
import { TEST_TOKENS, UID } from './helpers/seed-ids'
import { buildPushTokenPayload } from './helpers/factory'
import { req, parseBody } from './helpers/request'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}))

import { POST as registerTokenRoute } from '@/app/api/v1/push-tokens/route'
import { DELETE as deactivateTokenRoute } from '@/app/api/v1/push-tokens/[token]/route'
import { GET as listMyTokensRoute } from '@/app/api/v1/users/me/push-tokens/route'

const createdTokenIds: string[] = []

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(createSupabaseAdminClient).mockResolvedValue(buildAdminClient() as never)
  vi.mocked(createSupabaseServerClient).mockResolvedValue(buildServerClient() as never)
})

afterEach(async () => {
  if (createdTokenIds.length > 0) {
    await prisma.pushToken.deleteMany({ where: { id: { in: createdTokenIds } } })
    createdTokenIds.length = 0
  }
})

// ---------------------------------------------------------------------------
// POST /push-tokens
// ---------------------------------------------------------------------------
describe('POST /push-tokens', () => {
  it('[SUCCESS] registra token anônimo (sem userId) → 201', async () => {
    const payload = buildPushTokenPayload()

    const response = await registerTokenRoute(req.post('/push-tokens', payload))

    expect(response.status).toBe(201)
    const body = await parseBody<{ data: { id: string; token: string; platform: string } }>(response)
    expect(body.data.token).toBe(payload.token)
    expect(body.data.platform).toBe('android')

    // Verificar no banco
    const dbToken = await prisma.pushToken.findFirst({
      where: { token: payload.token },
    })
    expect(dbToken).not.toBeNull()
    expect(dbToken?.userId).toBeNull() // token anônimo

    if (body.data.id) createdTokenIds.push(body.data.id)
  })

  it('[SUCCESS] registra token vinculado a usuário autenticado → 201', async () => {
    const payload = buildPushTokenPayload({ platform: 'ios' })

    const response = await registerTokenRoute(
      req.post('/push-tokens', payload, { token: TEST_TOKENS.receptor })
    )

    expect(response.status).toBe(201)
    const body = await parseBody<{ data: { id: string; userId: string } }>(response)
    expect(body.data.userId).toBe(UID.receptor)

    const dbToken = await prisma.pushToken.findFirst({ where: { token: payload.token } })
    expect(dbToken?.userId).toBe(UID.receptor)

    if (body.data.id) createdTokenIds.push(body.data.id)
  })

  it('[SUCCESS] upsert — registrar mesmo deviceId com novo token atualiza, não duplica', async () => {
    const deviceId = `device-upsert-${Date.now()}`
    const firstPayload = buildPushTokenPayload({ deviceId, token: `ExponentPushToken[first-${deviceId}]` })
    const secondPayload = { ...firstPayload, token: `ExponentPushToken[second-${deviceId}]` }

    // Primeiro registro
    const first = await registerTokenRoute(req.post('/push-tokens', firstPayload))
    const firstBody = await parseBody<{ data: { id: string } }>(first)
    if (firstBody.data?.id) createdTokenIds.push(firstBody.data.id)

    // Segundo registro com mesmo deviceId — deve atualizar token
    const second = await registerTokenRoute(req.post('/push-tokens', secondPayload))
    expect(second.status).toBe(201)

    // Deve existir apenas 1 registro para este deviceId
    const count = await prisma.pushToken.count({ where: { deviceId } })
    expect(count).toBe(1)

    const dbToken = await prisma.pushToken.findFirst({ where: { deviceId } })
    expect(dbToken?.token).toBe(secondPayload.token)
    if (dbToken?.id && !createdTokenIds.includes(dbToken.id)) createdTokenIds.push(dbToken.id)
  })

  it('[VALIDATION] token sem formato Expo válido → 422', async () => {
    const response = await registerTokenRoute(
      req.post('/push-tokens', { token: 'invalid', deviceId: 'device1', platform: 'android' })
    )

    expect(response.status).toBe(422)
  })

  it('[VALIDATION] platform inválida → 422', async () => {
    const response = await registerTokenRoute(
      req.post('/push-tokens', buildPushTokenPayload({ platform: 'windows-phone' }))
    )

    expect(response.status).toBe(422)
  })

  it('[VALIDATION] payload vazio → 422', async () => {
    const response = await registerTokenRoute(req.post('/push-tokens', {}))
    expect(response.status).toBe(422)
  })
})

// ---------------------------------------------------------------------------
// GET /users/me/push-tokens
// ---------------------------------------------------------------------------
describe('GET /users/me/push-tokens', () => {
  it('[SUCCESS] lista tokens ativos do usuário autenticado', async () => {
    // Cria token para o receptor
    const payload = buildPushTokenPayload()
    const createResp = await registerTokenRoute(
      req.post('/push-tokens', payload, { token: TEST_TOKENS.receptor })
    )
    const created = await parseBody<{ data: { id: string } }>(createResp)
    if (created.data?.id) createdTokenIds.push(created.data.id)

    const response = await listMyTokensRoute(
      req.get('/users/me/push-tokens', { token: TEST_TOKENS.receptor })
    )

    expect(response.status).toBe(200)
    const body = await parseBody<{
      data: Array<{ userId: string; isActive: boolean }>
      pagination: unknown
    }>(response)

    expect(Array.isArray(body.data)).toBe(true)
    // Apenas tokens do próprio usuário, apenas ativos
    body.data.forEach((t) => {
      expect(t.userId).toBe(UID.receptor)
      expect(t.isActive).toBe(true)
    })
  })

  it('[AUTH] sem token → 401', async () => {
    const response = await listMyTokensRoute(req.get('/users/me/push-tokens'))
    expect(response.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// DELETE /push-tokens/{token}
// ---------------------------------------------------------------------------
describe('DELETE /push-tokens/{token}', () => {
  it('[SUCCESS] desativa token → 204 e isActive=false no banco', async () => {
    const payload = buildPushTokenPayload()
    const createResp = await registerTokenRoute(
      req.post('/push-tokens', payload, { token: TEST_TOKENS.receptor })
    )
    const created = await parseBody<{ data: { id: string; token: string } }>(createResp)
    const tokenValue = created.data.token
    if (created.data?.id) createdTokenIds.push(created.data.id)

    const response = await deactivateTokenRoute(
      req.delete(`/push-tokens/${encodeURIComponent(tokenValue)}`, { token: TEST_TOKENS.receptor }),
      { params: Promise.resolve({ token: tokenValue }) }
    )

    expect(response.status).toBe(204)

    // Verificar no banco — token deve estar inativo
    const dbToken = await prisma.pushToken.findFirst({ where: { token: tokenValue } })
    expect(dbToken?.isActive).toBe(false)
  })

  it('[NOT FOUND] token inexistente → 404', async () => {
    const response = await deactivateTokenRoute(
      req.delete('/push-tokens/ExponentPushToken[inexistente]', { token: TEST_TOKENS.receptor }),
      { params: Promise.resolve({ token: 'ExponentPushToken[inexistente]' }) }
    )

    expect(response.status).toBe(404)
  })

  it('[AUTH] sem token → 401', async () => {
    const response = await deactivateTokenRoute(
      req.delete('/push-tokens/qualquer'),
      { params: Promise.resolve({ token: 'qualquer' }) }
    )

    expect(response.status).toBe(401)
  })
})
