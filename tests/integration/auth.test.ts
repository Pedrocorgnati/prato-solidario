/**
 * Testes de integração — Auth
 *
 * Cobre: POST /auth/login, POST /auth/logout, GET /auth/session,
 *        POST /auth/password-reset, POST /auth/resend-verification
 *
 * Supabase Auth é mockado (serviço externo).
 * Banco de dados real via Prisma + DATABASE_URL_TEST.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server'
import { buildAdminClient, buildServerClient } from './helpers/mock-supabase'
import { TEST_TOKENS, UID } from './helpers/seed-ids'
import { req, parseBody } from './helpers/request'

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}))

// Importar handlers após mock para garantir que recebem o módulo mockado
import { POST as loginRoute } from '@/app/api/v1/auth/login/route'
import { POST as logoutRoute } from '@/app/api/v1/auth/logout/route'
import { GET as sessionRoute } from '@/app/api/v1/auth/session/route'
import { POST as passwordResetRoute } from '@/app/api/v1/auth/password-reset/route'
import { POST as resendVerificationRoute } from '@/app/api/v1/auth/resend-verification/route'

describe('POST /auth/login', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('[SUCCESS] retorna sessão com token e role para credenciais válidas', async () => {
    // Configura Supabase Auth para login bem-sucedido
    vi.mocked(createSupabaseServerClient).mockResolvedValue(buildServerClient({
      signInWithPassword: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: UID.doadorPf,
            email: 'clien4testing@corgnati.com',
            user_metadata: { role: 'DOADOR_PF' },
            email_confirmed_at: new Date().toISOString(),
          },
          session: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          },
        },
        error: null,
      }),
    }) as never)
    vi.mocked(createSupabaseAdminClient).mockResolvedValue(buildAdminClient() as never)

    const response = await loginRoute(
      req.post('/auth/login', {
        email: 'clien4testing@corgnati.com',
        password: 'Password4testing!',
      })
    )

    expect(response.status).toBe(200)
    const body = await parseBody<{ data: { session: { accessToken: string }; user: { role: string } } }>(response)
    expect(body.data.session.accessToken).toBeDefined()
    expect(body.data.user.role).toBe('DOADOR_PF')
  })

  it('[ERROR] AUTH_INVALID_CREDENTIALS — credenciais incorretas → 401', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(buildServerClient({
      signInWithPassword: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      }),
    }) as never)
    vi.mocked(createSupabaseAdminClient).mockResolvedValue(buildAdminClient() as never)

    const response = await loginRoute(
      req.post('/auth/login', {
        email: 'naoexiste@example.com',
        password: 'senhaerrada',
      })
    )

    expect(response.status).toBe(401)
    const body = await parseBody<{ error: string }>(response)
    // Mensagem genérica — não revela qual campo está errado (US-023)
    expect(body.error).toBe('AUTH_INVALID_CREDENTIALS')
  })

  it('[ERROR] AUTH_EMAIL_NOT_VERIFIED — conta sem e-mail verificado → 401', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(buildServerClient({
      signInWithPassword: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Email not confirmed' },
      }),
    }) as never)
    vi.mocked(createSupabaseAdminClient).mockResolvedValue(buildAdminClient() as never)

    const response = await loginRoute(
      req.post('/auth/login', {
        email: 'marmitaria@prato-solidario.test', // marmSusp: emailVerified=false no seed
        password: 'Test@Marmitaria2025!',
      })
    )

    expect(response.status).toBe(401)
    const body = await parseBody<{ error: string }>(response)
    expect(body.error).toBe('AUTH_EMAIL_NOT_VERIFIED')
  })

  it('[VALIDATION] VAL_002 — payload sem e-mail → 422', async () => {
    const response = await loginRoute(
      req.post('/auth/login', { password: 'senha123' })
    )

    expect(response.status).toBe(422)
    const body = await parseBody<{ error: string; fields: Record<string, string[]> }>(response)
    expect(body.error).toBe('VAL_002')
    expect(body.fields).toHaveProperty('email')
  })

  it('[VALIDATION] VAL_002 — e-mail com formato inválido → 422', async () => {
    const response = await loginRoute(
      req.post('/auth/login', { email: 'nao-e-um-email', password: 'senha123' })
    )

    expect(response.status).toBe(422)
    const body = await parseBody<{ error: string }>(response)
    expect(body.error).toBe('VAL_002')
  })

  it('[SECURITY] payload JSON malformado → 400', async () => {
    const request = new (await import('next/server')).NextRequest(
      'http://localhost:3000/api/v1/auth/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{ invalid json }',
      }
    )

    const response = await loginRoute(request)
    expect(response.status).toBe(400)
  })
})

describe('POST /auth/logout', () => {
  beforeEach(() => vi.resetAllMocks())

  it('[SUCCESS] encerra sessão → 204', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(buildServerClient() as never)
    vi.mocked(createSupabaseAdminClient).mockResolvedValue(buildAdminClient() as never)

    const response = await logoutRoute(
      req.post('/auth/logout', undefined, { token: TEST_TOKENS.doadorPf })
    )

    expect(response.status).toBe(204)
  })

  it('[AUTH] sem token → 401', async () => {
    vi.mocked(createSupabaseAdminClient).mockResolvedValue(buildAdminClient() as never)

    const response = await logoutRoute(req.post('/auth/logout'))
    expect(response.status).toBe(401)
  })
})

describe('GET /auth/session', () => {
  beforeEach(() => vi.resetAllMocks())

  it('[SUCCESS] retorna dados da sessão para token válido', async () => {
    vi.mocked(createSupabaseAdminClient).mockResolvedValue(buildAdminClient() as never)

    const response = await sessionRoute(
      req.get('/auth/session', { token: TEST_TOKENS.admin })
    )

    expect(response.status).toBe(200)
    const body = await parseBody<{ data: { user: { role: string } } }>(response)
    expect(body.data.user.role).toBe('ADMIN')
  })

  it('[AUTH] sem token → 401', async () => {
    vi.mocked(createSupabaseAdminClient).mockResolvedValue(buildAdminClient() as never)

    const response = await sessionRoute(req.get('/auth/session'))
    expect(response.status).toBe(401)
  })

  it('[AUTH] token inválido → 401', async () => {
    vi.mocked(createSupabaseAdminClient).mockResolvedValue(buildAdminClient() as never)

    const response = await sessionRoute(
      req.get('/auth/session', { token: 'token-invalido-nao-mapeado' })
    )

    expect(response.status).toBe(401)
    const body = await parseBody<{ error: string }>(response)
    expect(body.error).toBe('AUTH_TOKEN_INVALID')
  })
})

describe('POST /auth/password-reset', () => {
  beforeEach(() => vi.resetAllMocks())

  it('[SUCCESS] resposta uniforme para e-mail existente → 200 (proteção contra enumeração)', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(buildServerClient() as never)

    const response = await passwordResetRoute(
      req.post('/auth/password-reset', { email: 'admin4testing@corgnati.com' })
    )

    expect(response.status).toBe(200)
    const body = await parseBody<{ message: string }>(response)
    expect(body.message).toBeDefined()
  })

  it('[SUCCESS] resposta uniforme para e-mail inexistente → 200 (proteção contra enumeração)', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(buildServerClient() as never)

    const response = await passwordResetRoute(
      req.post('/auth/password-reset', { email: 'naoexiste@nowhere.com' })
    )

    // MESMO status independente de o e-mail existir (US-023)
    expect(response.status).toBe(200)
  })

  it('[VALIDATION] e-mail inválido → 422', async () => {
    const response = await passwordResetRoute(
      req.post('/auth/password-reset', { email: 'nao-email' })
    )

    expect(response.status).toBe(422)
  })
})

describe('POST /auth/resend-verification', () => {
  beforeEach(() => vi.resetAllMocks())

  it('[SUCCESS] reenvio aceito → 200', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(buildServerClient() as never)

    const response = await resendVerificationRoute(
      req.post('/auth/resend-verification', { email: 'clien4testing@corgnati.com' })
    )

    expect(response.status).toBe(200)
  })

  it('[VALIDATION] sem e-mail → 422', async () => {
    const response = await resendVerificationRoute(
      req.post('/auth/resend-verification', {})
    )

    expect(response.status).toBe(422)
  })
})
