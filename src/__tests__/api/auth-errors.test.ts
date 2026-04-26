/**
 * Testes de integração para cenários de erro em rotas de auth e usuários.
 * @see src/app/api/v1/auth/login/route.ts
 * @see src/app/api/v1/users/register/donor-pf/route.ts
 * @see src/app/api/v1/users/me/deletion-request/route.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — devem ser declarados antes dos imports dinâmicos
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/services/auth.service', () => ({
  authService: {
    signIn: vi.fn(),
    getSessionFromToken: vi.fn(),
  },
}))

vi.mock('@/services/user.service', () => ({
  userService: {
    createDonorPF: vi.fn(),
    requestDeletion: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// AUTH_003 — conta não verificada retorna 401 (AUTH_EMAIL_NOT_VERIFIED)
// ---------------------------------------------------------------------------

describe('AUTH_003 — conta não verificada', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('login com e-mail não verificado retorna 401', async () => {
    const { POST } = await import('@/app/api/v1/auth/login/route')
    const { authService } = await import('@/services/auth.service')

    // authService.signIn lança AUTH_EMAIL_NOT_VERIFIED (comportamento real da rota)
    vi.mocked(authService.signIn).mockRejectedValueOnce(
      Object.assign(new Error('AUTH_EMAIL_NOT_VERIFIED'), { code: 'AUTH_EMAIL_NOT_VERIFIED' })
    )

    const req = new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'Test@1234' }),
    })

    const res = await POST(req)
    // AUTH_002 = { code: 'AUTH_EMAIL_NOT_VERIFIED', status: 401 }
    expect(res.status).toBe(401)

    const body = await res.json()
    expect(body.error).toBe('AUTH_EMAIL_NOT_VERIFIED')
  })
})

// ---------------------------------------------------------------------------
// SYS_004 — auth OK mas DB falhou (register retorna 500)
// ---------------------------------------------------------------------------

describe('SYS_004 — auth OK mas DB falhou', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registro retorna 500 quando userService.createDonorPF lança erro genérico', async () => {
    const { POST } = await import('@/app/api/v1/users/register/donor-pf/route')
    const { userService } = await import('@/services/user.service')

    vi.mocked(userService.createDonorPF).mockRejectedValueOnce(
      new Error('DB connection failed')
    )

    const req = new Request('http://localhost/api/v1/users/register/donor-pf', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Novo Usuário',
        email: 'novo@exemplo.com',
        password: 'Senha@123456',
        phone: '+5511999999999',
        termsAccepted: true,
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body).toHaveProperty('error')
    // Não deve vazar mensagem interna
    expect(JSON.stringify(body)).not.toContain('DB connection failed')
  })
})

// ---------------------------------------------------------------------------
// USER_083 — doações ativas bloqueiam exclusão (409)
// ---------------------------------------------------------------------------

describe('USER_083 — doações ativas bloqueiam exclusão', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletion-request bloqueado quando há doações ativas → 409', async () => {
    const { POST } = await import('@/app/api/v1/users/me/deletion-request/route')
    const { authService } = await import('@/services/auth.service')
    const { userService } = await import('@/services/user.service')

    // Simula sessão autenticada
    vi.mocked(authService.getSessionFromToken).mockResolvedValueOnce({
      userId: 'user-1',
    } as any)

    // requestDeletion lança USER_HAS_ACTIVE_DONATIONS
    vi.mocked(userService.requestDeletion).mockRejectedValueOnce(
      new Error('USER_HAS_ACTIVE_DONATIONS')
    )

    const req = new Request('http://localhost/api/v1/users/me/deletion-request', {
      method: 'POST',
      headers: { authorization: 'Bearer mock-token' },
      body: JSON.stringify({ reason: 'Quero sair da plataforma' }),
    })

    const res = await POST(req)
    // USER_006 = { code: 'USER_HAS_ACTIVE_DONATIONS', status: 409 }
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.error).toBe('USER_HAS_ACTIVE_DONATIONS')
  })

  it('deletion-request sem token retorna 401', async () => {
    const { POST } = await import('@/app/api/v1/users/me/deletion-request/route')

    const req = new Request('http://localhost/api/v1/users/me/deletion-request', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Sair' }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})
