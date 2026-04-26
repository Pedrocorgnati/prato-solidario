import { describe, it, expect } from 'vitest'
import { PII_FIELDS, redactObject } from '@/lib/constants/pii'

describe('PII_FIELDS', () => {
  it('contém todos os campos PII esperados', () => {
    expect(PII_FIELDS).toContain('email')
    expect(PII_FIELDS).toContain('cpf')
    expect(PII_FIELDS).toContain('cnpj')
    expect(PII_FIELDS).toContain('password')
    expect(PII_FIELDS).toContain('token')
    expect(PII_FIELDS).toContain('accessToken')
    expect(PII_FIELDS).toContain('refreshToken')
  })
})

describe('redactObject', () => {
  it('redacta campos PII em objetos simples', () => {
    const result = redactObject({ email: 'test@x.com', ok: 'safe' })
    expect(result.email).toBe('[REDACTED_EMAIL]')
    expect(result.ok).toBe('safe')
  })

  it('redacta campos PII em objetos aninhados', () => {
    const result = redactObject({
      user: { password: '123', name: 'João' },
    })
    const user = result.user as Record<string, unknown>
    expect(user.password).toBe('[REDACTED_PASSWORD]')
    expect(user.name).toBe('João')
  })

  it('é case-insensitive para nomes de campo', () => {
    const result = redactObject({ Email: 'x@y.com', CPF: '000' })
    expect(result.Email).toBe('[REDACTED_EMAIL]')
    expect(result.CPF).toBe('[REDACTED_CPF]')
  })

  it('preserva campos não-PII intactos', () => {
    const result = redactObject({ route: '/api/test', method: 'POST', statusCode: 200 })
    expect(result.route).toBe('/api/test')
    expect(result.method).toBe('POST')
    expect(result.statusCode).toBe(200)
  })
})
