import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

export default function MarmitariaLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <LoadingSkeleton variant="card" count={3} />
    </div>
  )
}
