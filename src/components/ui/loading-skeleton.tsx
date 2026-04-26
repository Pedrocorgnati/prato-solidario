import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface LoadingSkeletonProps {
  variant?: "card" | "table-row" | "form-field" | "avatar"
  count?: number
  className?: string
}

export function LoadingSkeleton({
  variant = "card",
  count = 3,
  className,
}: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-label="Carregando...">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} variant={variant} />
      ))}
    </div>
  )
}

function SkeletonItem({ variant }: { variant: LoadingSkeletonProps["variant"] }) {
  switch (variant) {
    case "card":
      return (
        <div className="rounded-lg border border-[var(--color-border-raw)] p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      )
    case "table-row":
      return (
        <div className="flex items-center gap-4 py-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      )
    case "form-field":
      return (
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      )
    case "avatar":
      return (
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      )
    default:
      return <Skeleton className="h-4 w-full" />
  }
}
