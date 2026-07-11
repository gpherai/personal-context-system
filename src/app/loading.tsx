export default function Loading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6" role="status" aria-label="Loading">
      <span className="sr-only">Loading…</span>

      {/* Header */}
      <div className="border-b border-border pb-5">
        <div className="h-3 w-16 animate-pulse rounded-full bg-surface-muted" />
        <div className="mt-3 h-8 w-64 max-w-full animate-pulse rounded-lg bg-surface-muted" />
        <div className="mt-3 h-3.5 w-80 max-w-full animate-pulse rounded-full bg-surface-muted" />
      </div>

      {/* Generic content blocks */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="h-4 w-24 animate-pulse rounded-full bg-surface-muted" />
            <div className="mt-3 h-3.5 w-full animate-pulse rounded-full bg-surface-muted" />
            <div className="mt-2 h-3.5 w-2/3 animate-pulse rounded-full bg-surface-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
