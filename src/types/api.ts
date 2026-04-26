import type { PaginationMeta } from './pagination'

// ---------------------------------------------------------------------------
// Resposta padrão de sucesso
// ---------------------------------------------------------------------------
export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  timestamp: string
}

// ---------------------------------------------------------------------------
// Resposta de erro padrão
// ---------------------------------------------------------------------------
export interface ApiError {
  error: string
  code: string
  details?: Record<string, string[]>
  timestamp: string
}

// ---------------------------------------------------------------------------
// Resposta paginada
// ---------------------------------------------------------------------------
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta
}

// ---------------------------------------------------------------------------
// Union type para handlers
// ---------------------------------------------------------------------------
export type ApiResult<T> = ApiResponse<T> | ApiError

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------
export function isApiError(res: ApiResult<unknown>): res is ApiError {
  return 'error' in res && 'code' in res
}

// ---------------------------------------------------------------------------
// Helpers de construção de resposta
// ---------------------------------------------------------------------------
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    data,
    message,
    timestamp: new Date().toISOString(),
  }
}

export function errorResponse(
  error: string,
  code: string,
  details?: Record<string, string[]>
): ApiError {
  return {
    error,
    code,
    details,
    timestamp: new Date().toISOString(),
  }
}
