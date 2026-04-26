import { describe, it, expect } from 'vitest'
import { sanitizeForSentry } from '@/lib/sentry'

describe('sanitizeForSentry', () => {
  it('redacta campos PII de nível 1', () => {
    const input = { email: 'user@example.com', name: 'João', cpf: '123.456.789-00' }
    const result = sanitizeForSentry(input) as Record<string, unknown>

    expect(result.email).toBe('[REDACTED_EMAIL]')
    expect(result.cpf).toBe('[REDACTED_CPF]')
    expect(result.name).toBe('João')
  })

  it('redacta campos PII aninhados recursivamente', () => {
    const input = {
      user: { email: 'deep@test.com', profile: { password: 'secret' } },
      action: 'login',
    }
    const result = sanitizeForSentry(input) as Record<string, unknown>
    const user = result.user as Record<string, unknown>
    const profile = user.profile as Record<string, unknown>

    expect(user.email).toBe('[REDACTED_EMAIL]')
    expect(profile.password).toBe('[REDACTED_PASSWORD]')
    expect(result.action).toBe('login')
  })

  it('lida com arrays sem quebrar', () => {
    const input = [{ email: 'a@b.com' }, { name: 'ok' }]
    const result = sanitizeForSentry(input) as Record<string, unknown>[]

    expect(result[0].email).toBe('[REDACTED_EMAIL]')
    expect(result[1].name).toBe('ok')
  })

  it('retorna primitivos inalterados', () => {
    expect(sanitizeForSentry(null)).toBeNull()
    expect(sanitizeForSentry(42)).toBe(42)
    expect(sanitizeForSentry('hello')).toBe('hello')
  })

  it('redacta token e accessToken', () => {
    const input = { token: 'abc123', accessToken: 'xyz', refreshToken: 'ref' }
    const result = sanitizeForSentry(input) as Record<string, unknown>

    expect(result.token).toBe('[REDACTED_TOKEN]')
    expect(result.accessToken).toBe('[REDACTED_ACCESSTOKEN]')
    expect(result.refreshToken).toBe('[REDACTED_REFRESHTOKEN]')
  })
})
