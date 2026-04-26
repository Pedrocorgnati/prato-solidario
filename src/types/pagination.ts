import { z } from 'zod'

// ---------------------------------------------------------------------------
// Offset Pagination
// ---------------------------------------------------------------------------
export interface OffsetPaginationParams {
  page: number
  limit: number
}

export interface OffsetPaginationMeta {
  type: 'offset'
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/**
 * Versão estendida de paginação offset para APIs complexas.
 * Inclui metadados ricos (totalPages, hasPrevPage, type discriminator).
 *
 * Para uso simples (Server Actions, componentes internos), prefira
 * `PaginatedResponse<T>` de `src/types/common.ts`, que é mais leve
 * e dispensa o wrapper `pagination`.
 */
export interface OffsetPaginatedResponse<T> {
  data: T[]
  pagination: OffsetPaginationMeta
}

// ---------------------------------------------------------------------------
// Cursor Pagination
// ---------------------------------------------------------------------------
export interface CursorPaginationParams {
  cursor?: string
  limit: number
  direction?: 'forward' | 'backward'
}

export interface CursorPaginationMeta {
  type: 'cursor'
  limit: number
  nextCursor: string | null
  prevCursor: string | null
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface CursorPaginatedResponse<T> {
  data: T[]
  pagination: CursorPaginationMeta
}

// ---------------------------------------------------------------------------
// Union
// ---------------------------------------------------------------------------
export type PaginationMeta = OffsetPaginationMeta | CursorPaginationMeta

// ---------------------------------------------------------------------------
// Zod Schemas para query params
// ---------------------------------------------------------------------------
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const cursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  direction: z.enum(['forward', 'backward']).default('forward'),
})

// ---------------------------------------------------------------------------
// Config padrão
// ---------------------------------------------------------------------------
export const DEFAULT_PAGINATION_CONFIG = {
  defaultLimit: 20,
  maxLimit: 100,
  defaultPage: 1,
} as const

// ---------------------------------------------------------------------------
// Helper — calcula OffsetPaginationMeta
// ---------------------------------------------------------------------------
export function buildOffsetMeta(
  total: number,
  page: number,
  limit: number
): OffsetPaginationMeta {
  const totalPages = Math.ceil(total / limit)
  return {
    type: 'offset',
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}
