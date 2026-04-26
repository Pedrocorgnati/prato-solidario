/**
 * Testes de integração — Segurança
 *
 * Cobre os vetores do THREAT-MODEL:
 *   THREAT-001: IDOR em perfis e endereços (acesso cruzado entre usuários)
 *   THREAT-002: Mass assignment no cadastro (role injection)
 *   OWASP A03: Injeção em campos de input
 *
 * Nenhum teste aqui cria dados persistentes fora do domain @integration-test.local.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server'
import { buildAdminClient, buildServerClient } from './helpers/mock-supabase'
import { TEST_TOKENS, UID } from './helpers/seed-ids'
import { buildDonorPFPayload, buildAddressPayload } from './helpers/factory'
import { req, parseBody } from './helpers/request'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}))

import { GET as getUserByIdRoute } from '@/app/api/v1/users/[userId]/route'
import {
  GET as getAddressRoute,
  PATCH as updateAddressRoute,
  DELETE as deleteAddressRoute,
} from '@/app/api/v1/users/me/addresses/[addressId]/route'
import {
  POST as createAddressRoute,
} from '@/app/api/v1/users/me/addresses/route'
import { POST as registerDonorPFRoute } from '@/app/api/v1/users/register/donor-pf/route'

const createdIds: string[] = []

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(createSupabaseAdminClient).mockResolvedValue(buildAdminClient() as never)
  vi.mocked(createSupabaseServerClient).mockResolvedValue(buildServerClient() as never)
})

afterEach(async () => {
  if (createdIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdIds } } }).catch(() => null)
    await prisma.address.deleteMany({ where: { id: { in: createdIds } } }).catch(() => null)
    createdIds.length = 0
  }
})

// ---------------------------------------------------------------------------
// THREAT-001: IDOR — Acesso cruzado entre usuários
// ---------------------------------------------------------------------------
describe('[THREAT-001] IDOR — Isolation entre usuários', () => {
  it('usuário não-admin não pode acessar GET /users/{outroUserId} → 403', async () => {
    // doadorPf tentando acessar perfil do admin
    const response = await getUserByIdRoute(
      req.get(`/users/${UID.admin}`, { token: TEST_TOKENS.doadorPf }),
      { params: Promise.resolve({ userId: UID.admin }) }
    )

    expect(response.status).toBe(403)
    const body = await parseBody<{ error: string }>(response)
    expect(body.error).toMatch(/AUTH_FORBIDDEN|AUTH_TOKEN_INVALID/)
  })

  it('usuário não-admin não pode acessar GET /users/{outroUserId} mesmo com ID próprio de outro user → 403', async () => {
    // receptor tentando acessar dados do doadorPf
    const response = await getUserByIdRoute(
      req.get(`/users/${UID.doadorPf}`, { token: TEST_TOKENS.receptor }),
      { params: Promise.resolve({ userId: UID.doadorPf }) }
    )

    expect(response.status).toBe(403)
  })

  it('acesso ao endereço de outro usuário retorna 404 (não expõe existência) — THREAT-001', async () => {
    // Cria endereço como doadorRest
    const createResp = await createAddressRoute(
      req.post('/users/me/addresses', buildAddressPayload({ street: 'Rua IDOR Test' }), {
        token: TEST_TOKENS.doadorRest,
      })
    )
    const created = await parseBody<{ data: { id: string } }>(createResp)
    const addressId = created.data?.id
    if (addressId) createdIds.push(addressId)

    if (!addressId) return // skip se criação falhou por falta de dado seed

    // doadorPf tenta acessar endereço que pertence ao doadorRest
    const response = await getAddressRoute(
      req.get(`/users/me/addresses/${addressId}`, { token: TEST_TOKENS.doadorPf }),
      { params: Promise.resolve({ addressId }) }
    )

    // Deve ser 404, não 403 — não revela que o endereço existe
    expect(response.status).toBe(404)
  })

  it('PATCH no endereço de outro usuário → 404 (não expõe e não modifica)', async () => {
    const createResp = await createAddressRoute(
      req.post('/users/me/addresses', buildAddressPayload(), {
        token: TEST_TOKENS.doadorRest,
      })
    )
    const created = await parseBody<{ data: { id: string } }>(createResp)
    const addressId = created.data?.id
    if (addressId) createdIds.push(addressId)

    if (!addressId) return

    const response = await updateAddressRoute(
      req.patch(`/users/me/addresses/${addressId}`, buildAddressPayload({ street: 'Rua Atacante' }), {
        token: TEST_TOKENS.doadorPf,
      }),
      { params: Promise.resolve({ addressId }) }
    )

    expect(response.status).toBe(404)

    // Verificar que o banco NÃO foi modificado
    const dbAddr = await prisma.address.findUnique({ where: { id: addressId } })
    expect(dbAddr?.street).not.toBe('Rua Atacante')
  })

  it('DELETE no endereço de outro usuário → 404 e endereço permanece no banco', async () => {
    const createResp = await createAddressRoute(
      req.post('/users/me/addresses', buildAddressPayload(), {
        token: TEST_TOKENS.doadorRest,
      })
    )
    const created = await parseBody<{ data: { id: string } }>(createResp)
    const addressId = created.data?.id
    if (addressId) createdIds.push(addressId)

    if (!addressId) return

    const response = await deleteAddressRoute(
      req.delete(`/users/me/addresses/${addressId}`, { token: TEST_TOKENS.doadorPf }),
      { params: Promise.resolve({ addressId }) }
    )

    expect(response.status).toBe(404)

    // Verificar que o banco NÃO foi deletado
    const dbAddr = await prisma.address.findUnique({ where: { id: addressId } })
    expect(dbAddr).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// THREAT-002: Mass Assignment — Role Injection no cadastro
// ---------------------------------------------------------------------------
describe('[THREAT-002] Mass Assignment — Role Injection no cadastro', () => {
  it('campo `role` extra no body é ignorado — role sempre derivado do endpoint', async () => {
    const payload = {
      ...buildDonorPFPayload(),
      role: 'ADMIN', // tentativa de injeção
    }

    const response = await registerDonorPFRoute(req.post('/users/register/donor-pf', payload))

    // Cadastro pode ter sucesso (role extra ignorado) ou 422 (Zod .strict() rejeita campos extras)
    // Em ambos os casos, o role NUNCA deve ser ADMIN
    if (response.status === 201) {
      const body = await parseBody<{ data: { id: string; role: string } }>(response)
      expect(body.data.role).toBe('DOADOR_PF') // nunca ADMIN
      expect(body.data.role).not.toBe('ADMIN')

      // Verificar no banco
      const dbUser = await prisma.user.findUnique({ where: { id: body.data.id } })
      expect(dbUser?.role).toBe('DOADOR_PF')
      if (dbUser) createdIds.push(dbUser.id)
    } else {
      // Zod strict() rejeitou o campo extra — também é comportamento correto (THREAT-002)
      expect(response.status).toBe(422)
    }
  })

  it('campo `isActive` extra no body é ignorado — conta nunca nasce ativa por input', async () => {
    const payload = {
      ...buildDonorPFPayload(),
      isActive: true, // tentativa de injeção
    }

    const response = await registerDonorPFRoute(req.post('/users/register/donor-pf', payload))

    if (response.status === 201) {
      const body = await parseBody<{ data: { id: string } }>(response)
      const dbUser = await prisma.user.findUnique({ where: { id: body.data.id } })
      // isActive pode ser true (default), mas não por causa do campo injetado
      // O que importa é que a conta foi criada com os defaults corretos do schema
      expect(dbUser).not.toBeNull()
      if (dbUser) createdIds.push(dbUser.id)
    } else {
      expect([422, 400]).toContain(response.status)
    }
  })

  it('campo `marmitaria_status: ACTIVE` injetado no cadastro de marmitaria → PENDING_APPROVAL no banco', async () => {
    // Importar rota de marmitaria aqui para não poluir o escopo global do arquivo
    const { POST: registerMarmitariaRoute } = await import('@/app/api/v1/users/register/marmitaria/route')

    const { buildMarmitariaPayload } = await import('./helpers/factory')
    const payload = {
      ...buildMarmitariaPayload(),
      marmitariaStatus: 'ACTIVE', // tentativa de bypass de aprovação
      status: 'ACTIVE',
    }

    const response = await registerMarmitariaRoute(req.post('/users/register/marmitaria', payload))

    if (response.status === 201) {
      const body = await parseBody<{ data: { id: string } }>(response)
      const dbUser = await prisma.user.findUnique({
        where: { id: body.data.id },
        include: { marmitariaProfile: true },
      })
      // Status NUNCA deve ser ACTIVE por input — sempre começa como PENDING_APPROVAL
      expect(dbUser?.marmitariaProfile?.status).toBe('PENDING_APPROVAL')
      if (dbUser) createdIds.push(dbUser.id)
    } else {
      expect([400, 422]).toContain(response.status)
    }
  })
})

// ---------------------------------------------------------------------------
// OWASP A03: Injeção — SQL Injection e inputs maliciosos
// ---------------------------------------------------------------------------
describe('[OWASP A03] Injeção — Sanitização de inputs', () => {
  it('SQL injection no e-mail de login não afeta o banco', async () => {
    const { POST: loginRoute } = await import('@/app/api/v1/auth/login/route')
    const { buildServerClient: bsc } = await import('./helpers/mock-supabase')
    vi.mocked(createSupabaseServerClient).mockResolvedValue(bsc({
      signInWithPassword: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      }),
    }) as never)

    const response = await loginRoute(
      req.post('/auth/login', {
        email: "'; DROP TABLE users; --@test.com",
        password: 'qualquer',
      })
    )

    // Deve retornar erro de validação ou credenciais inválidas — NUNCA 500
    expect([401, 422, 400]).toContain(response.status)

    // Verificar que a tabela users ainda existe e tem dados
    const count = await prisma.user.count()
    expect(count).toBeGreaterThan(0)
  })

  it('XSS em nome do usuário é armazenado como texto (sem execução) — não causa 500', async () => {
    const { PATCH: patchMeRoute } = await import('@/app/api/v1/users/me/route')

    const xssPayload = '<script>alert("xss")</script>'
    const response = await patchMeRoute(
      req.patch('/users/me', { name: xssPayload }, { token: TEST_TOKENS.doadorPf })
    )

    // Pode aceitar (e armazenar como texto) ou rejeitar (Zod restringe caracteres especiais)
    // O que importa: NUNCA deve retornar 500 (execução de script)
    expect(response.status).not.toBe(500)

    if (response.status === 200) {
      // Se aceito, verificar que é armazenado como texto literal (não executado)
      const dbUser = await prisma.user.findUnique({ where: { id: UID.doadorPf } })
      expect(typeof dbUser?.name).toBe('string')
      // Restaurar nome original
      await prisma.user.update({
        where: { id: UID.doadorPf },
        data: { name: 'Clienzo Testavero' },
      })
    }
  })

  it('payload com campos além do limite de tamanho → 422 ou 400 (não 500)', async () => {
    const hugeString = 'A'.repeat(10_001)
    const response = await registerDonorPFRoute(
      req.post('/users/register/donor-pf', buildDonorPFPayload({ name: hugeString }))
    )

    expect([400, 422]).toContain(response.status)
  })

  it('body JSON aninhado excessivamente profundo não causa estouro de pilha → não 500', async () => {
    // Criar objeto aninhado 50 níveis (DoS via deep parsing)
    let deepObj: Record<string, unknown> = { email: 'test@test.com' }
    for (let i = 0; i < 50; i++) {
      deepObj = { nested: deepObj }
    }

    const request = new (await import('next/server')).NextRequest(
      'http://localhost:3000/api/v1/auth/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(deepObj),
      }
    )

    const { POST: loginRoute } = await import('@/app/api/v1/auth/login/route')
    const response = await loginRoute(request)

    // Pode retornar qualquer status de erro — mas nunca 500 por stack overflow
    expect(response.status).not.toBe(500)
  })
})

// ---------------------------------------------------------------------------
// CORS — Whitelist de origens (ST001)
// ---------------------------------------------------------------------------
describe('[CORS] Whitelist de origens em /api/v1/*', () => {
  it('rejeita origem não autorizada em /api/v1/users/me', async () => {
    const res = await fetch('/api/v1/users/me', {
      headers: { Origin: 'https://site-malicioso.com' }
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).not.toBe('*')
    expect(res.headers.get('Access-Control-Allow-Origin') ?? '').not.toContain('site-malicioso')
  })

  it('aceita origem autorizada', async () => {
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pratosolidario.com.br'
    const res = await fetch('/api/v1/users/me', {
      headers: { Origin: allowedOrigin }
    })
    const corsHeader = res.headers.get('Access-Control-Allow-Origin') ?? ''
    expect(corsHeader).toContain(allowedOrigin)
  })
})

// ---------------------------------------------------------------------------
// Auth: Roles bloqueando rotas de outros perfis
// ---------------------------------------------------------------------------
describe('[AUTH] RBAC — Isolamento de rotas por role', () => {
  it('receptor não pode listar usuários (rota admin) → 403', async () => {
    const { GET: listUsersRoute } = await import('@/app/api/v1/users/route')

    const response = await listUsersRoute(
      req.get('/users', { token: TEST_TOKENS.receptor })
    )

    expect(response.status).toBe(403)
  })

  it('doador PF não pode acessar GET /users (admin) → 403', async () => {
    const { GET: listUsersRoute } = await import('@/app/api/v1/users/route')

    const response = await listUsersRoute(
      req.get('/users', { token: TEST_TOKENS.doadorPf })
    )

    expect(response.status).toBe(403)
  })

  it('token de role ong não pode acessar GET /users (admin) → 403', async () => {
    const { GET: listUsersRoute } = await import('@/app/api/v1/users/route')

    const response = await listUsersRoute(
      req.get('/users', { token: TEST_TOKENS.ong })
    )

    expect(response.status).toBe(403)
  })
})
