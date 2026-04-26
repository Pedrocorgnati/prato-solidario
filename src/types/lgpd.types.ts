/**
 * Tipos e interfaces para o módulo de Perfil + LGPD.
 * @see module-6-profile-lgpd/TASK-0/ST002
 *
 * Dependências verificadas (TASK-0/ST004):
 *   ✓ components/shared/photo-upload.tsx    — module-2/TASK-8
 *   ✓ components/shared/cep-input.tsx       — module-2/TASK-7
 *   ✓ components/shared/phone-input.tsx     — module-2/TASK-7
 *   ✓ components/ui/confirm-dialog.tsx      — module-2/TASK-5
 *   ✓ components/ui/empty-state.tsx         — module-2/TASK-5
 *   ✓ hooks/useToast.ts                     — module-2/TASK-4
 *   ✓ lib/auth/session.ts                   — module-3/TASK-2
 *   ✓ types/enums.ts (ConsentVersion)       — module-1/TASK-1
 *
 * Nota: User.photoUrl (não avatarUrl). Address sem campo label (TODO: migração futura).
 * scheduledAnonymizationAt não existe no schema — computado via deletedAt + 30 dias em runtime.
 */

// Re-exportar ConsentVersion do Prisma client (disponível após prisma generate)
import { ConsentVersion as _ConsentVersion } from '@prisma/client'
export { _ConsentVersion as ConsentVersion }
type ConsentVersion = _ConsentVersion

export enum DataExportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
}

export interface ProfileUpdateData {
  name?: string
  phone?: string
  photoUrl?: string
}

export interface AnonymizationResult {
  success: boolean
  anonymizedAt: Date
  affectedRecords: number
}

export interface LGPDServiceResult<T = void> {
  success: boolean
  data?: T
  error?: string
  errorCode?: string
}

export interface AddressFormData {
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
}

/** Versão atual dos Termos de Uso/Privacidade. Alterar aqui para forçar re-aceite global. */
export const CURRENT_TERMS_VERSION: ConsentVersion = 'V2' as ConsentVersion
