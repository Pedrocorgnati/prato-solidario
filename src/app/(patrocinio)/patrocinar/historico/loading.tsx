export default function PatrocinioHistoricoLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6 animate-pulse">
      {/* Title skeleton */}
      <div className="h-8 w-64 rounded bg-[var(--color-muted-raw)]" />

      {/* Total investido skeleton */}
      <div className="rounded-lg border border-[var(--color-border-raw)] bg-[var(--color-surface)] px-6 py-4 space-y-2">
        <div className="h-4 w-24 rounded bg-[var(--color-muted-raw)]" />
        <div className="h-7 w-36 rounded bg-[var(--color-muted-raw)]" />
      </div>

      {/* Table skeleton */}
      <div className="w-full overflow-hidden rounded-lg border border-[var(--color-border-raw)]">
        {/* Table header */}
        <div className="flex gap-4 bg-[var(--color-surface)] px-4 py-3">
          <div className="h-4 w-20 rounded bg-[var(--color-muted-raw)]" />
          <div className="h-4 w-32 rounded bg-[var(--color-muted-raw)]" />
          <div className="h-4 w-20 rounded bg-[var(--color-muted-raw)]" />
          <div className="h-4 w-20 rounded bg-[var(--color-muted-raw)]" />
          <div className="h-4 w-16 rounded bg-[var(--color-muted-raw)]" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 border-t border-[var(--color-border-raw)] px-4 py-3"
          >
            <div className="h-4 w-20 rounded bg-[var(--color-muted-raw)]" />
            <div className="h-4 w-32 rounded bg-[var(--color-muted-raw)]" />
            <div className="h-4 w-20 rounded bg-[var(--color-muted-raw)]" />
            <div className="h-4 w-20 rounded bg-[var(--color-muted-raw)]" />
            <div className="h-4 w-16 rounded bg-[var(--color-muted-raw)]" />
          </div>
        ))}
      </div>
    </div>
  )
}
