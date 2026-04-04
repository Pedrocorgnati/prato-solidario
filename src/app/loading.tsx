// RESOLVED: loading.tsx ausente — sem route-level Suspense em nenhuma rota
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

export default function RootLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <LoadingSkeleton variant="card" count={3} />
    </div>
  )
}
