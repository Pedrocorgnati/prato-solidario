'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

interface DarkModeToggleProps {
  className?: string
}

/**
 * Toggle de modo escuro/claro.
 * Usa next-themes para persistência e respeito à preferência do sistema.
 * SSR-safe: renderiza placeholder até montar no cliente.
 * @see module-7-layout-navigation/TASK-4/ST001
 */
export function DarkModeToggle({ className }: DarkModeToggleProps) {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  if (!mounted) {
    return (
      <div
        className={cn(
          'h-11 w-11 rounded-md',
          className
        )}
        aria-hidden="true"
      />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      data-testid="dark-mode-toggle"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-md transition-colors',
        'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-muted-raw)]',
        className
      )}
    >
      {isDark ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  )
}
