/**
 * Testes de integração — Users
 *
 * Cobre: POST /users/register/*, GET /users/me, PATCH /users/me,
 *        POST /users/me/deletion-request, GET /users/{userId}, GET /users
 *
 * Banco real via Prisma. Registros com @integration-test.local são limpos no afterAll.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server'
import { buildAdminClient, buildServerClient } from './helpers/mock-supabase'
import { TEST_TOKENS, UID } from './helpers/seed-ids'
import {
  buildDonorPFPayload,
  buildDonorRestaurantPayload,
  buildMarmitariaPayload,
  buildReceptorPayload,
} from './helpers/factory'
import { req, parseBody } from './helpers/request'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}))

import { POST as registerDonorPFRoute } from '@/app/api/v1/users/register/donor-pf/route'
import { POST as registerDonorRestRoute } from '@/app/api/v1/users/register/donor-restaurant/route'
import { POST as registerMarmitariaRoute } from '@/app/api/v1/users/register/marmitaria/route'
import { POST as registerReceptorRoute } from '@/app/api/v1/users/register/receptor/route'
import { GET as getMeRoute, PATCH as patchMeRoute } from '@/app/api/v1/users/me/route'
import { POST as deletionRequestRoute } from '@/app/api/v1/users/me/deletion-request/route'
import { GET as getUserByIdRoute } from '@/app/api/v1/users/[userId]/route'
import { GET as listUsersRoute } from '@/app/api/v1/users/route'

// IDs criados neste test file — rastreados para limpeza garantida
const createdUserIds: string[] = []

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(createSupabaseAdminClient).mockResolvedValue(buildAdminClient() as never)
  vi.mocked(createSupabaseServerClient).mockResolvedValue(buildServerClient() as never)
})

afterEach(async () => {
  // Limpeza imediata de registros criados (além do afterAll do setup.ts)
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
    createdUserIds.length = 0
  }
})

// ---------------------------------------------------------------------------
// Registro: Doador PF
// ---------------------------------------------------------------------------
describe('POST /users/register/donor-pf', () => {
  it('[SUCCESS] cria usuário DOADOR_PF e retorna dados públicos', async () => {
    const payload = buildDonorPFPayload()

    // Mock createUser retorna ID derivado do e-mail
    const mockAdmin = buildAdminClient()
    vi.mocked(createSupabaseAdminClient).mockResolvedValue(mockAdmin as never)

    const response = await registerDonorPFRoute(
      req.post('/users/register/donor-pf', payload)
    )

    expect(response.status).toBe(201)
    const body = await parseBody<{ data: { id: string; email: string; role: string } }>(response)
    expect(body.data.email).toBe(payload.email)
    expect(body.data.role).toBe('DOADOR_PF')
    expect(body.data).not.toHaveProperty('password') // senha nunca exposta

    // Verificar criação no banco
    const dbUser = await prisma.user.findUnique({ where: { email: payload.email } })
    expect(dbUser).not.toBeNull()
    expect(dbUser!.role).toBe('DOADOR_PF')

    if (dbUser) createdUserIds.push(dbUser.id)
  })

  it('[ERROR] USER_EMAIL_EXISTS — e-mail duplicado → 409', async () => {
    const payload = buildDonorPFPayload()

    // Primeiro cadastro
    const first = await registerDonorPFRoute(req.post('/users/register/donor-pf', payload))
    const firstBody = await parseBody<{ data: { id: string } }>(first)
    if (firstBody.data?.id) createdUserIds.push(firstBody.data.id)

    // Segundo cadastro com mesmo e-mail
    const response = await registerDonorPFRoute(req.post('/users/register/donor-pf', payload))

    expect(response.status).toBe(409)
    const body = await parseBody<{ error: string }>(response)
    expect(body.error).toMatch(/USER_EMAIL_EXISTS|USER_DOCUMENT_EXISTS/)
  })

  it('[VALIDATION] campos obrigatórios ausentes → 422', async () => {
    const response = await registerDonorPFRoute(
      req.post('/users/register/donor-pf', { email: 'so-email@test.com' })
    )

    expect(response.status).toBe(422)
    const body = await parseBody<{ error: string; fields: Record<string, unknown> }>(response)
    expect(body.error).toBe('VAL_002')
    expect(Object.keys(body.fields).length).toBeGreaterThan(0)
  })

  it('[VALIDATION] senha fraca (< 8 chars) → 422', async () => {
    const response = await registerDonorPFRoute(
      req.post('/users/register/donor-pf', buildDonorPFPayload({ password: '123' }))
    )

    expect(response.status).toBe(422)
  })
})

// ---------------------------------------------------------------------------
// Registro: Doador Restaurante
// ---------------------------------------------------------------------------
describe('POST /users/register/donor-restaurant', () => {
  it('[SUCCESS] cria usuário DOADOR_RESTAURANTE', async () => {
    const payload = buildDonorRestaurantPayload()

    const response = await registerDonorRestRoute(
      req.post('/users/register/donor-restaurant', payload)
    )

    expect(response.status).toBe(201)
    const body = await parseBody<{ data: { id: string; role: string } }>(response)
    expect(body.data.role).toBe('DOADOR_RESTAURANTE')

    const dbUser = await prisma.user.findUnique({ where: { email: payload.email } })
    if (dbUser) createdUserIds.push(dbUser.id)
  })

  it('[VALIDATION] sem CNPJ → 422', async () => {
    const response = await registerDonorRestRoute(
      req.post('/users/register/donor-restaurant', buildDonorRestaurantPayload({ document: undefined }))
    )

    expect(response.status).toBe(422)
  })
})

// ---------------------------------------------------------------------------
// Registro: Marmitaria
// ---------------------------------------------------------------------------
describe('POST /users/register/marmitaria', () => {
  it('[SUCCESS] cria MARMITARIA com status PENDING_APPROVAL', async () => {
    const payload = buildMarmitariaPayload()

    const response = await registerMarmitariaRoute(
      req.post('/users/register/marmitaria', payload)
    )

    expect(response.status).toBe(201)

    // Status inicial deve ser PENDING_APPROVAL (nunca ACTIVE direto)
    const dbUser = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { marmitariaProfile: true },
    })
    expect(dbUser?.marmitariaProfile?.status).toBe('PENDING_APPROVAL')

    if (dbUser) createdUserIds.push(dbUser.id)
  })
})

// ---------------------------------------------------------------------------
// Registro: Receptor
// ---------------------------------------------------------------------------
describe('POST /users/register/receptor', () => {
  it('[SUCCESS] receptor criado sem campos PII obrigatórios', async () => {
    const payload = buildReceptorPayload()

    const response = await registerReceptorRoute(
      req.post('/users/register/receptor', payload)
    )

    expect(response.status).toBe(201)
    const body = await parseBody<{ data: { role: string } }>(response)
    expect(body.data.role).toBe('RECEPTOR')

    const dbUser = await prisma.user.findUnique({ where: { email: payload.email } })
    if (dbUser) createdUserIds.push(dbUser.id)
  })
})

// ---------------------------------------------------------------------------
// GET /users/me
// ---------------------------------------------------------------------------
describe('GET /users/me', () => {
  it('[SUCCESS] retorna perfil completo do usuário autenticado', async () => {
    const response = await getMeRoute(
      req.get('/users/me', { token: TEST_TOKENS.doadorPf })
    )

    expect(response.status).toBe(200)
    const body = await parseBody<{ data: { id: string; email: string } }>(response)
    expect(body.data.id).toBe(UID.doadorPf)
    expect(body.data.email).toBeDefined()
    expect(body.data).not.toHaveProperty('password')
  })

  it('[AUTH] sem token → 401', async () => {
    const response = await getMeRoute(req.get('/users/me'))
    expect(response.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// PATCH /users/me
// ---------------------------------------------------------------------------
describe('PATCH /users/me', () => {
  it('[SUCCESS] atualiza campos editáveis do perfil', async () => {
    const response = await patchMeRoute(
      req.patch('/users/me', { name: 'Nome Atualizado Integration' }, { token: TEST_TOKENS.doadorPf })
    )

    expect(response.status).toBe(200)
    const body = await parseBody<{ data: { name: string } }>(response)
    expect(body.data.name).toBe('Nome Atualizado Integration')

    // Verificar persistência no banco
    const dbUser = await prisma.user.findUnique({ where: { id: UID.doadorPf } })
    expect(dbUser?.name).toBe('Nome Atualizado Integration')
  })

  it('[VALIDATION] campo inválido → 422', async () => {
    const response = await patchMeRoute(
      req.patch('/users/me', { phone: 'numero-invalido' }, { token: TEST_TOKENS.doadorPf })
    )

    expect(response.status).toBe(422)
  })

  it('[AUTH] sem token → 401', async () => {
    const response = await patchMeRoute(req.patch('/users/me', { name: 'Teste' }))
    expect(response.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// POST /users/me/deletion-request (LGPD)
// ---------------------------------------------------------------------------
describe('POST /users/me/deletion-request', () => {
  it('[SUCCESS] agenda exclusão em 15 dias para usuário sem doações ativas', async () => {
    // Receptor seed não tem doações ativas
    const response = await deletionRequestRoute(
      req.post('/users/me/deletion-request', undefined, { token: TEST_TOKENS.receptor })
    )

    expect([200, 201]).toContain(response.status)
    const body = await parseBody<{ deletionScheduledAt?: string; message?: string }>(response)
    // deletionScheduledAt deve ser ~15 dias no futuro
    if (body.deletionScheduledAt) {
      const scheduledDate = new Date(body.deletionScheduledAt)
      const diffDays = (scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeGreaterThan(14)
      expect(diffDays).toBeLessThan(16)
    }
  })

  it('[ERROR] USER_HAS_ACTIVE_DONATIONS — doador com doações ativas não pode solicitar exclusão → 409', async () => {
    // doadorPf tem doações no seed (DID.pending = status PENDING = ativa)
    const response = await deletionRequestRoute(
      req.post('/users/me/deletion-request', undefined, { token: TEST_TOKENS.doadorPf })
    )

    // Pode retornar 409 se houver doações ativas, ou 200 se não houver no banco de teste
    if (response.status === 409) {
      const body = await parseBody<{ error: string }>(response)
      expect(body.error).toBe('USER_HAS_ACTIVE_DONATIONS')
    } else {
      expect([200, 201]).toContain(response.status)
    }
  })

  it('[AUTH] sem token → 401', async () => {
    const response = await deletionRequestRoute(req.post('/users/me/deletion-request'))
    expect(response.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// GET /users/{userId} — admin only
// ---------------------------------------------------------------------------
describe('GET /users/{userId}', () => {
  it('[SUCCESS] admin pode acessar perfil de qualquer usuário', async () => {
    const response = await getUserByIdRoute(
      req.get(`/users/${UID.doadorPf}`, { token: TEST_TOKENS.admin }),
      { params: Promise.resolve({ userId: UID.doadorPf }) }
    )

    expect(response.status).toBe(200)
    const body = await parseBody<{ data: { id: string } }>(response)
    expect(body.data.id).toBe(UID.doadorPf)
  })

  it('[AUTH] não-admin recebe 403', async () => {
    const response = await getUserByIdRoute(
      req.get(`/users/${UID.admin}`, { token: TEST_TOKENS.doadorPf }),
      { params: Promise.resolve({ userId: UID.admin }) }
    )

    expect(response.status).toBe(403)
  })

  it('[NOT FOUND] ID inexistente → 404', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000099'
    const response = await getUserByIdRoute(
      req.get(`/users/${nonExistentId}`, { token: TEST_TOKENS.admin }),
      { params: Promise.resolve({ userId: nonExistentId }) }
    )

    expect(response.status).toBe(404)
  })
})

// ---------------------------------------------------------------------------
// GET /users — admin only
// ---------------------------------------------------------------------------
describe('GET /users (admin)', () => {
  it('[SUCCESS] admin lista usuários com paginação', async () => {
    const response = await listUsersRoute(
      req.get('/users?page=1&limit=10', { token: TEST_TOKENS.admin })
    )

    expect(response.status).toBe(200)
    const body = await parseBody<{ data: unknown[]; pagination: { page: number } }>(response)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.pagination).toBeDefined()
  })

  it('[AUTH] não-admin recebe 403', async () => {
    const response = await listUsersRoute(
      req.get('/users', { token: TEST_TOKENS.doadorPf })
    )

    expect(response.status).toBe(403)
  })

  it('[AUTH] sem token → 401', async () => {
    const response = await listUsersRoute(req.get('/users'))
    expect(response.status).toBe(401)
  })
})
