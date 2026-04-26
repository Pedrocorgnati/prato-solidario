export default function MarmitariaDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Hero skeleton */}
      <div className="h-64 w-full rounded-lg bg-[var(--color-surface)] animate-pulse" />

      {/* Info skeleton */}
      <div className="space-y-3">
        <div className="h-7 w-60 rounded bg-[var(--color-surface)] animate-pulse" />
        <div className="h-4 w-40 rounded bg-[var(--color-surface)] animate-pulse" />
        <div className="h-4 w-48 rounded bg-[var(--color-surface)] animate-pulse" />
        <div className="h-12 w-full rounded bg-[var(--color-surface)] animate-pulse mt-2" />
      </div>

      {/* Stepper skeleton */}
      <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-background-raw)] p-4 space-y-3">
        <div className="h-4 w-56 rounded bg-[var(--color-surface)] animate-pulse" />
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded bg-[var(--color-surface)] animate-pulse" />
          <div className="h-11 w-20 rounded bg-[var(--color-surface)] animate-pulse" />
          <div className="h-11 w-11 rounded bg-[var(--color-surface)] animate-pulse" />
        </div>
        <div className="h-4 w-36 rounded bg-[var(--color-surface)] animate-pulse" />
      </div>

      {/* CTA skeleton */}
      <div className="h-14 w-full rounded-md bg-[var(--color-surface)] animate-pulse" />
    </div>
  )
}
