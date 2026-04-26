'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Persiste estado no localStorage. SSR-safe — retorna initialValue no servidor.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  }, [key, initialValue])

  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Hidrata com o valor real do localStorage apos montagem no client
  useEffect(() => {
    setStoredValue(readValue())
  }, [readValue])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (typeof window === 'undefined') return

      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      } catch (error) {
        console.warn(`Erro ao salvar "${key}" no localStorage:`, error)
      }
    },
    [key, storedValue],
  )

  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.warn(`Erro ao remover "${key}" do localStorage:`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}
