/**
 * Fábrica de mocks para @/lib/supabase/server
 *
 * Uso nos arquivos de teste:
 *
 *   import { vi } from 'vitest'
 *   import { buildAdminClient } from './helpers/mock-supabase'
 *
 *   vi.mock('@/lib/supabase/server', () => ({
 *     createSupabaseAdminClient: vi.fn(),
 *     createSupabaseServerClient: vi.fn(),
 *   }))
 *
 *   // Em beforeEach:
 *   const mockAdmin = buildAdminClient()
 *   vi.mocked(createSupabaseAdminClient).mockResolvedValue(mockAdmin as any)
 */

import { vi } from 'vitest'
import { UID, TEST_TOKENS } from './seed-ids'

// Mapeamento token → user do seed
const TOKEN_USER_MAP: Record<string, {
  id: string
  email: string
  role: string
  emailVerified: boolean
  isActive: boolean
}> = {
  [TEST_TOKENS.admin]:        { id: UID.admin,        email: 'admin4testing@corgnati.com',         role: 'ADMIN',                emailVerified: true,  isActive: true },
  [TEST_TOKENS.doadorPf]:     { id: UID.doadorPf,     email: 'clien4testing@corgnati.com',         role: 'DOADOR_PF',            emailVerified: true,  isActive: true },
  [TEST_TOKENS.doadorRest]:   { id: UID.doadorRest,   email: 'restaurante@prato-solidario.test',   role: 'DOADOR_RESTAURANTE',   emailVerified: true,  isActive: true },
  [TEST_TOKENS.marmAtiva]:    { id: UID.marmAtiva,    email: 'marmitaria@prato-solidario.test',    role: 'MARMITARIA',           emailVerified: true,  isActive: true },
  [TEST_TOKENS.receptor]:     { id: UID.receptor,     email: 'lead4testing@corgnati.com',          role: 'RECEPTOR',             emailVerified: true,  isActive: true },
  [TEST_TOKENS.ong]:          { id: UID.ong,          email: 'ong@prato-solidario.test',           role: 'ONG',                  emailVerified: true,  isActive: true },
  [TEST_TOKENS.patrocinador]: { id: UID.patrocinador, email: 'patrocinador@prato-solidario.test',  role: 'PATROCINADOR',         emailVerified: true,  isActive: true },
}

/**
 * Cria um mock de createSupabaseAdminClient que:
 * - auth.getUser(token) → resolve user por token
 * - auth.admin.createUser(...) → retorna ID gerado deterministicamente
 */
export function buildAdminClient(
  tokenMap: typeof TOKEN_USER_MAP = TOKEN_USER_MAP,
  overrides: Record<string, unknown> = {},
) {
  let _createUserIdCounter = 0

  return {
    auth: {
      getUser: vi.fn().mockImplementation(async (token: string) => {
        const u = tokenMap[token]
        if (!u) return { data: { user: null }, error: { message: 'Invalid token' } }
        return {
          data: {
            user: {
              id: u.id,
              email: u.email,
              user_metadata: { role: u.role },
              email_confirmed_at: u.emailVerified ? new Date().toISOString() : null,
            },
          },
          error: null,
        }
      }),
      admin: {
        createUser: vi.fn().mockImplementation(async ({
          email,
          user_metadata,
        }: { email: string; user_metadata: { role: string } }) => {
          _createUserIdCounter++
          // ID fictício — mas como mockamos createUser, a rota irá usar este ID
          // para criar o registro no banco. Como não queremos poluir o banco de teste
          // com IDs aleatórios, usamos um UUID determinístico baseado no e-mail.
          const id = `test-${Buffer.from(email).toString('hex').slice(0, 28).padEnd(28, '0')}`
          return {
            data: { user: { id, email, user_metadata } },
            error: null,
          }
        }),
      },
      ...overrides,
    },
  }
}

/**
 * Cria um mock de createSupabaseServerClient (usado por getSession/signOut/etc.)
 */
export function buildServerClient(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not mocked' } }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      resend: vi.fn().mockResolvedValue({ error: null }),
      ...overrides,
    },
  }
}
