'use client'

import { useCallback, useMemo, useState } from 'react'

export interface UsePaginationReturn {
  page: number
  perPage: number
  offset: number
  nextPage: () => void
  prevPage: () => void
  goToPage: (page: number) => void
  reset: () => void
}

/**
 * Gerencia estado de paginacao offset-based.
 */
export function usePagination(
  initialPage = 1,
  perPage = 10,
): UsePaginationReturn {
  const [page, setPage] = useState(initialPage)

  const offset = useMemo(() => (page - 1) * perPage, [page, perPage])

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1)
  }, [])

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1))
  }, [])

  const goToPage = useCallback((target: number) => {
    setPage(Math.max(1, target))
  }, [])

  const reset = useCallback(() => {
    setPage(initialPage)
  }, [initialPage])

  return { page, perPage, offset, nextPage, prevPage, goToPage, reset }
}
