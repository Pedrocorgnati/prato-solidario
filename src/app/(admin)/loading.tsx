import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

export default function AdminLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <LoadingSkeleton variant="table-row" count={6} />
    </div>
  )
}
