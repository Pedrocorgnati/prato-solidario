/**
 * Barrel export de todos os tipos compartilhados.
 * @see module-2-shared-foundations/TASK-1/ST004
 */

export * from './enums'
export * from './common'
export * from './dto'

// Re-exporta tipos legados para compatibilidade retroativa
export type { ApiResponse, ApiError, PaginatedApiResponse, ApiResult } from './api'
export { isApiError, successResponse, errorResponse } from './api'
export type {
  OffsetPaginationParams,
  OffsetPaginationMeta,
  OffsetPaginatedResponse,
  CursorPaginationParams,
  CursorPaginationMeta,
  CursorPaginatedResponse,
  PaginationMeta,
} from './pagination'
export {
  paginationQuerySchema,
  cursorQuerySchema,
  DEFAULT_PAGINATION_CONFIG,
  buildOffsetMeta,
} from './pagination'
