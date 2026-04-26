/**
 * Validação reutilizável de senha — min 8 caracteres, letra + dígito,
 * blocklist de senhas comuns, score 0..3 (fraca/média/forte).
 * @see intake-review TASK-8/ST001 (CL-253)
 */

import { z } from 'zod'
import { COMMON_PASSWORDS } from './common-passwords'

export const PASSWORD_MIN_LENGTH = 8

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `A senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres.`)
  .regex(/[A-Za-z]/, 'A senha deve conter pelo menos uma letra.')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número.')
  .refine(
    (pw) => !COMMON_PASSWORDS.has(pw.toLowerCase()),
    'Essa senha é muito comum. Escolha uma combinação menos previsível.'
  )

/**
 * Score 0..3 por heurística simples de entropia.
 * 0 = muito fraca, 1 = fraca, 2 = média, 3 = forte.
 */
export function scorePassword(pw: string): 0 | 1 | 2 | 3 {
  if (!pw || pw.length < PASSWORD_MIN_LENGTH) return 0
  if (COMMON_PASSWORDS.has(pw.toLowerCase())) return 0

  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 1) return 1
  if (score <= 3) return 2
  return 3
}

export interface PasswordChecklistItem {
  key: 'length' | 'letter' | 'digit' | 'notCommon'
  label: string
  passed: boolean
}

export function passwordChecklist(pw: string): PasswordChecklistItem[] {
  return [
    { key: 'length', label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`, passed: pw.length >= PASSWORD_MIN_LENGTH },
    { key: 'letter', label: 'Pelo menos uma letra', passed: /[A-Za-z]/.test(pw) },
    { key: 'digit', label: 'Pelo menos um número', passed: /[0-9]/.test(pw) },
    { key: 'notCommon', label: 'Não é uma senha comum', passed: !COMMON_PASSWORDS.has(pw.toLowerCase()) },
  ]
}

export const STRENGTH_LABELS: Record<0 | 1 | 2 | 3, string> = {
  0: 'Muito fraca',
  1: 'Fraca',
  2: 'Média',
  3: 'Forte',
}
