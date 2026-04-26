"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FilterOption {
  label: string
  value: string
}

interface FilterBarProps {
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterOption[]
  activeFilter?: string
  onFilterChange?: (value: string) => void
  className?: string
}

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters,
  activeFilter,
  onFilterChange,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      {onSearchChange !== undefined && (
        <div className="relative flex-1" role="search">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
      {filters && filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange?.(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
