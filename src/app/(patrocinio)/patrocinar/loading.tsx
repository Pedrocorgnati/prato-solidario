export default function PatrocinarLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-56 rounded bg-[var(--color-surface)] animate-pulse" />
        <div className="h-4 w-80 rounded bg-[var(--color-surface)] animate-pulse" />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] overflow-hidden"
          >
            <div className="h-36 bg-[var(--color-surface)] animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 rounded bg-[var(--color-surface)] animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-[var(--color-surface)] animate-pulse" />
              <div className="flex items-center justify-between pt-1">
                <div className="h-4 w-24 rounded bg-[var(--color-surface)] animate-pulse" />
                <div className="h-8 w-20 rounded bg-[var(--color-surface)] animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
