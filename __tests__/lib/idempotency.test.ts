/**
 * Tests — src/lib/idempotency.ts
 * @see intake-review TASK-8/ST003
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { withIdempotency, isValidIdempotencyKey, __resetIdempotencyStore } from '@/lib/idempotency'

describe('withIdempotency', () => {
  beforeEach(() => {
    __resetIdempotencyStore()
  })

  it('retorna mesmo resultado em retries com mesma key', async () => {
    let counter = 0
    const fn = async () => ++counter

    const a = await withIdempotency('k1', fn)
    const b = await withIdempotency('k1', fn)
    expect(a).toBe(1)
    expect(b).toBe(1)
    expect(counter).toBe(1)
  })

  it('executa de novo após erro (permite retry)', async () => {
    let attempt = 0
    const fn = async () => {
      attempt++
      if (attempt === 1) throw new Error('fail')
      return 'ok'
    }

    await expect(withIdempotency('k2', fn)).rejects.toThrow('fail')
    const result = await withIdempotency('k2', fn)
    expect(result).toBe('ok')
  })

  it('chaves distintas geram execuções distintas', async () => {
    let counter = 0
    const fn = async () => ++counter

    await withIdempotency('a', fn)
    await withIdempotency('b', fn)
    expect(counter).toBe(2)
  })
})

describe('isValidIdempotencyKey', () => {
  it('rejeita null/undefined/vazio', () => {
    expect(isValidIdempotencyKey(null)).toBe(false)
    expect(isValidIdempotencyKey(undefined)).toBe(false)
    expect(isValidIdempotencyKey('')).toBe(false)
  })

  it('rejeita muito curto', () => {
    expect(isValidIdempotencyKey('abc')).toBe(false)
  })

  it('aceita UUID', () => {
    expect(isValidIdempotencyKey('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })
})
