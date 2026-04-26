/**
 * Contrast unit tests — intake-review TASK-4/ST002 + ST005
 *
 * Valida que pares de tokens (foreground, background) satisfazem WCAG 2.1 AA:
 *   - texto normal: contraste >= 4.5:1
 *   - texto grande (>= 18pt regular ou 14pt bold): >= 3:1
 *
 * Calculo direto via formula relativa (nao depende de browser).
 * Complementa a suite Playwright + axe em tests/a11y/axe.test.ts.
 */
import { describe, it, expect } from 'vitest'

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '').trim()
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  return [r, g, b]
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(fg: string, bg: string): number {
  const l1 = relLuminance(hexToRgb(fg))
  const l2 = relLuminance(hexToRgb(bg))
  const [a, b] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (a + 0.05) / (b + 0.05)
}

// Tokens sincronizados com src/app/globals.css (:root)
const TOKENS = {
  background: '#FFFDF7',
  surface: '#F5F2EC',
  primary: '#2D8659',
  onPrimary: '#FFFFFF',
  secondary: '#E8852D',
  onSecondary: '#422006',
  accent: '#F5C842',
  onAccent: '#78350F',
  textPrimary: '#1C2B1F',
  textSecondary: '#57534E',
  textMuted: '#5A6478',
  success: '#047857',
  danger: '#C53030',
}

describe('WCAG AA contrast (normal text ≥ 4.5)', () => {
  it.each([
    ['textPrimary on background', TOKENS.textPrimary, TOKENS.background],
    ['textSecondary on background', TOKENS.textSecondary, TOKENS.background],
    ['textMuted on background', TOKENS.textMuted, TOKENS.background],
    ['textPrimary on surface', TOKENS.textPrimary, TOKENS.surface],
    ['onPrimary on primary', TOKENS.onPrimary, TOKENS.primary],
    ['onSecondary on secondary', TOKENS.onSecondary, TOKENS.secondary],
    ['onAccent on accent', TOKENS.onAccent, TOKENS.accent],
  ])('%s passes 4.5:1', (_label, fg, bg) => {
    const ratio = contrastRatio(fg, bg)
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })
})

describe('WCAG AA contrast (large text / decorative ≥ 3)', () => {
  it.each([
    ['success on background', TOKENS.success, TOKENS.background],
    ['danger on background', TOKENS.danger, TOKENS.background],
  ])('%s passes 3:1', (_label, fg, bg) => {
    const ratio = contrastRatio(fg, bg)
    expect(ratio).toBeGreaterThanOrEqual(3.0)
  })
})
