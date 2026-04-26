/**
 * Tipos compartilhados por todos os módulos da aplicação.
 * Usar como base para Server Actions, APIs e componentes.
 * @see module-2-shared-foundations/TASK-1/ST002
 */

// ---------------------------------------------------------------------------
// Resposta padrão de Server Actions
// ---------------------------------------------------------------------------

/**
 * Resposta padrão de Server Action ou chamada interna.
 * `data` é null em caso de erro; `error` é null em caso de sucesso.
 */
export interface ActionResponse<T> {
  data: T | null
  error: string | null
  status: number
}

// ---------------------------------------------------------------------------
// Paginação (offset)
// ---------------------------------------------------------------------------

/**
 * Versão canônica para uso simples (Server Actions, componentes internos).
 * Para APIs que precisam de metadados ricos (totalPages, hasPrevPage,
 * type discriminator), use `OffsetPaginatedResponse<T>` de `src/types/pagination.ts`.
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  hasNext: boolean
}

// ---------------------------------------------------------------------------
// Paginação (cursor)
// ---------------------------------------------------------------------------

/** Resultado paginado com cursor (para feeds infinitos) */
export interface CursorPaginatedResponse<T> {
  items: T[]
  nextCursor: string | null
}

// ---------------------------------------------------------------------------
// Endereço brasileiro
// ---------------------------------------------------------------------------

/** Endereço no formato brasileiro, compatível com retorno da ViaCEP */
export interface AddressBR {
  cep: string
  logradouro: string
  numero?: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  lat?: number
  lng?: number
}

// ---------------------------------------------------------------------------
// Geo
// ---------------------------------------------------------------------------

/** Par de coordenadas geográficas */
export interface GeoPoint {
  lat: number
  lng: number
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

/** Intervalo de datas */
export interface DateRange {
  start: Date
  end: Date
}

/** Informações de upload de arquivo */
export interface FileUpload {
  url: string
  name: string
  size: number
  type: string
}

/** Opção de select genérico */
export interface SelectOption<T = string> {
  label: string
  value: T
  disabled?: boolean
}

/** Item de breadcrumb */
export interface BreadcrumbItem {
  label: string
  href?: string
}
