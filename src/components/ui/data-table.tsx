"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  className?: string
  emptyMessage?: string
  onSort?: (key: string, direction: "asc" | "desc") => void
  sortKey?: string
  sortDirection?: "asc" | "desc"
}

export function DataTable<T extends object>({
  data,
  columns,
  className,
  emptyMessage = "Nenhum resultado encontrado.",
  onSort,
  sortKey,
  sortDirection,
}: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border border-[var(--color-border-raw)]", className)}>
      <table className="w-full text-sm">
        <thead className="bg-[var(--color-surface)]">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                scope="col"
                aria-sort={
                  col.sortable
                    ? sortKey === String(col.key)
                      ? sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                    : undefined
                }
                className={cn(
                  "px-4 py-3 text-left font-semibold text-[var(--color-text-primary)] whitespace-nowrap",
                  col.sortable && "cursor-pointer select-none hover:bg-[var(--color-muted-raw)]",
                  col.className
                )}
                onClick={() => {
                  if (col.sortable && onSort) {
                    onSort(
                      String(col.key),
                      sortKey === String(col.key) && sortDirection === "asc" ? "desc" : "asc"
                    )
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="text-[var(--color-text-muted)]">
                      {sortKey === String(col.key) ? (
                        sortDirection === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-[var(--color-text-muted)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={idx}
                className="border-t border-[var(--color-border-raw)] hover:bg-[var(--color-surface)] transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn("px-4 py-3 text-[var(--color-text-primary)]", col.className)}
                  >
                    {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
