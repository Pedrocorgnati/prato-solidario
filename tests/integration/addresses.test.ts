/**
 * Testes de integração — Addresses
 *
 * Cobre: GET/POST /users/me/addresses, GET/PATCH/DELETE /users/me/addresses/{id}
 * Banco real. Endereços criados são limpos no afterEach/afterAll.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server'
import { buildAdminClient, buildServerClient } from './helpers/mock-supabase'
import { TEST_TOKENS, UID } from './helpers/seed-ids'
import { buildAddressPayload } from './helpers/factory'
import { req, parseBody } from './helpers/request'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}))

import {
  GET as listAddressesRoute,
  POST as createAddressRoute,
} from '@/app/api/v1/users/me/addresses/route'
import {
  GET as getAddressRoute,
  PATCH as updateAddressRoute,
  DELETE as deleteAddressRoute,
} from '@/app/api/v1/users/me/addresses/[addressId]/route'

const createdAddressIds: string[] = []

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(createSupabaseAdminClient).mockResolvedValue(buildAdminClient() as never)
  vi.mocked(createSupabaseServerClient).mockResolvedValue(buildServerClient() as never)
})

afterEach(async () => {
  if (createdAddressIds.length > 0) {
    await prisma.address.deleteMany({ where: { id: { in: createdAddressIds } } })
    createdAddressIds.length = 0
  }
})

// ---------------------------------------------------------------------------
// POST /users/me/addresses
// ---------------------------------------------------------------------------
describe('POST /users/me/addresses', () => {
  it('[SUCCESS] cria endereço vinculado ao usuário autenticado', async () => {
    const payload = buildAddressPayload()

    const response = await createAddressRoute(
      req.post('/users/me/addresses', payload, { token: TEST_TOKENS.doadorRest })
    )

    expect(response.status).toBe(201)
    const body = await parseBody<{ data: { id: string; street: string; userId: string } }>(response)
    expect(body.data.street).toBe(payload.street)
    expect(body.data.userId).toBe(UID.doadorRest)

    // Verificar no banco
    const dbAddr = await prisma.address.findUnique({ where: { id: body.data.id } })
    expect(dbAddr).not.toBeNull()
    expect(dbAddr?.userId).toBe(UID.doadorRest)

    if (body.data.id) createdAddressIds.push(body.data.id)
  })

  it('[VALIDATION] CEP inválido → 422', async () => {
    const response = await createAddressRoute(
      req.post('/users/me/addresses', buildAddressPayload({ postalCode: 'abc' }), {
        token: TEST_TOKENS.doadorRest,
      })
    )

    expect(response.status).toBe(422)
  })

  it('[VALIDATION] campos obrigatórios ausentes → 422', async () => {
    const response = await createAddressRoute(
      req.post('/users/me/addresses', { complement: 'apenas complement' }, {
        token: TEST_TOKENS.doadorRest,
      })
    )

    expect(response.status).toBe(422)
    const body = await parseBody<{ error: string; fields: Record<string, unknown> }>(response)
    expect(body.error).toBe('VAL_002')
  })

  it('[AUTH] sem token → 401', async () => {
    const response = await createAddressRoute(
      req.post('/users/me/addresses', buildAddressPayload())
    )

    expect(response.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// GET /users/me/addresses
// ---------------------------------------------------------------------------
describe('GET /users/me/addresses', () => {
  it('[SUCCESS] lista apenas endereços do próprio usuário', async () => {
    // Cria endereço para o doadorRest
    const createResp = await createAddressRoute(
      req.post('/users/me/addresses', buildAddressPayload(), { token: TEST_TOKENS.doadorRest })
    )
    const created = await parseBody<{ data: { id: string } }>(createResp)
    if (created.data?.id) createdAddressIds.push(created.data.id)

    const response = await listAddressesRoute(
      req.get('/users/me/addresses', { token: TEST_TOKENS.doadorRest })
    )

    expect(response.status).toBe(200)
    const body = await parseBody<{
      data: Array<{ id: string; userId: string }>
      pagination: unknown
    }>(response)

    expect(Array.isArray(body.data)).toBe(true)
    // Todos os endereços retornados pertencem ao usuário autenticado
    body.data.forEach((addr) => {
      expect(addr.userId).toBe(UID.doadorRest)
    })
    expect(body.pagination).toBeDefined()
  })

  it('[AUTH] sem token → 401', async () => {
    const response = await listAddressesRoute(req.get('/users/me/addresses'))
    expect(response.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// GET /users/me/addresses/{addressId}
// ---------------------------------------------------------------------------
describe('GET /users/me/addresses/{addressId}', () => {
  it('[SUCCESS] retorna endereço específico do usuário', async () => {
    // Criar endereço para o teste
    const createResp = await createAddressRoute(
      req.post('/users/me/addresses', buildAddressPayload({ street: 'Rua Getaway Test' }), {
        token: TEST_TOKENS.doadorRest,
      })
    )
    const created = await parseBody<{ data: { id: string } }>(createResp)
    const addressId = created.data.id
    createdAddressIds.push(addressId)

    const response = await getAddressRoute(
      req.get(`/users/me/addresses/${addressId}`, { token: TEST_TOKENS.doadorRest }),
      { params: Promise.resolve({ addressId }) }
    )

    expect(response.status).toBe(200)
    const body = await parseBody<{ data: { id: string; street: string } }>(response)
    expect(body.data.id).toBe(addressId)
    expect(body.data.street).toBe('Rua Getaway Test')
  })

  it('[NOT FOUND] ID inexistente → 404', async () => {
    const fakeId = '00000000-0000-0000-ffff-000000000001'

    const response = await getAddressRoute(
      req.get(`/users/me/addresses/${fakeId}`, { token: TEST_TOKENS.doadorRest }),
      { params: Promise.resolve({ addressId: fakeId }) }
    )

    expect(response.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// PATCH /users/me/addresses/{addressId}
// ---------------------------------------------------------------------------
describe('PATCH /users/me/addresses/{addressId}', () => {
  it('[SUCCESS] atualiza endereço do usuário', async () => {
    const createResp = await createAddressRoute(
      req.post('/users/me/addresses', buildAddressPayload(), { token: TEST_TOKENS.doadorRest })
    )
    const created = await parseBody<{ data: { id: string } }>(createResp)
    const addressId = created.data.id
    createdAddressIds.push(addressId)

    const response = await updateAddressRoute(
      req.patch(
        `/users/me/addresses/${addressId}`,
        { ...buildAddressPayload(), complement: 'Bloco B - Atualizado' },
        { token: TEST_TOKENS.doadorRest }
      ),
      { params: Promise.resolve({ addressId }) }
    )

    expect(response.status).toBe(200)
    const body = await parseBody<{ data: { complement: string } }>(response)
    expect(body.data.complement).toBe('Bloco B - Atualizado')

    // Verificar persistência no banco
    const dbAddr = await prisma.address.findUnique({ where: { id: addressId } })
    expect(dbAddr?.complement).toBe('Bloco B - Atualizado')
  })

  it('[NOT FOUND] endereço de outro usuário não é visível → 404', async () => {
    // Cria endereço como doadorRest
    const createResp = await createAddressRoute(
      req.post('/users/me/addresses', buildAddressPayload(), { token: TEST_TOKENS.doadorRest })
    )
    const created = await parseBody<{ data: { id: string } }>(createResp)
    const addressId = created.data.id
    createdAddressIds.push(addressId)

    // Tenta acessar como doadorPf — isolamento por ownership
    const response = await updateAddressRoute(
      req.patch(`/users/me/addresses/${addressId}`, buildAddressPayload(), {
        token: TEST_TOKENS.doadorPf,
      }),
      { params: Promise.resolve({ addressId }) }
    )

    // Deve retornar 404 (não expõe que o endereço existe, pertence a outro usuário)
    expect(response.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// DELETE /users/me/addresses/{addressId}
// ---------------------------------------------------------------------------
describe('DELETE /users/me/addresses/{addressId}', () => {
  it('[SUCCESS] remove endereço → 204 e não existe mais no banco', async () => {
    const createResp = await createAddressRoute(
      req.post('/users/me/addresses', buildAddressPayload(), { token: TEST_TOKENS.doadorRest })
    )
    const created = await parseBody<{ data: { id: string } }>(createResp)
    const addressId = created.data.id
    // Não precisa adicionar ao createdAddressIds pois vamos deletar explicitamente

    const response = await deleteAddressRoute(
      req.delete(`/users/me/addresses/${addressId}`, { token: TEST_TOKENS.doadorRest }),
      { params: Promise.resolve({ addressId }) }
    )

    expect(response.status).toBe(204)

    // Confirmar remoção no banco
    const dbAddr = await prisma.address.findUnique({ where: { id: addressId } })
    expect(dbAddr).toBeNull()
  })

  it('[NOT FOUND] ID inexistente → 404', async () => {
    const fakeId = '00000000-0000-0000-ffff-000000000002'

    const response = await deleteAddressRoute(
      req.delete(`/users/me/addresses/${fakeId}`, { token: TEST_TOKENS.doadorRest }),
      { params: Promise.resolve({ addressId: fakeId }) }
    )

    expect(response.status).toBe(404)
  })

  it('[AUTH] sem token → 401', async () => {
    const response = await deleteAddressRoute(
      req.delete('/users/me/addresses/qualquer-id'),
      { params: Promise.resolve({ addressId: 'qualquer-id' }) }
    )

    expect(response.status).toBe(401)
  })
})
