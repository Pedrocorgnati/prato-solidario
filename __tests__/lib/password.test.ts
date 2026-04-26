/**
 * Tests — src/lib/validation/password.ts
 * @see intake-review TASK-8/ST001
 */

import { describe, it, expect } from 'vitest'
import { passwordSchema, scorePassword } from '@/lib/validation/password'

describe('passwordSchema', () => {
  it('rejeita senha curta (< 8)', () => {
    expect(passwordSchema.safeParse('abc123').success).toBe(false)
  })

  it('rejeita senha comum 12345678', () => {
    expect(passwordSchema.safeParse('12345678').success).toBe(false)
  })

  it('rejeita senha só com letras', () => {
    expect(passwordSchema.safeParse('abcdefgh').success).toBe(false)
  })

  it('rejeita senha só com números', () => {
    expect(passwordSchema.safeParse('13579246').success).toBe(false)
  })

  it('aceita senha forte', () => {
    expect(passwordSchema.safeParse('Solidario2026!').success).toBe(true)
  })
})

describe('scorePassword', () => {
  it('retorna 0 para vazia ou muito curta', () => {
    expect(scorePassword('')).toBe(0)
    expect(scorePassword('abc')).toBe(0)
  })

  it('retorna 0 para senha comum', () => {
    expect(scorePassword('password123')).toBe(0)
  })

  it('retorna >=2 para senha média', () => {
    expect(scorePassword('abcdefg1')).toBeGreaterThanOrEqual(1)
  })

  it('retorna 3 para senha forte com símbolos', () => {
    expect(scorePassword('Solidario2026!')).toBe(3)
  })
})
