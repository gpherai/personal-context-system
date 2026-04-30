export default function Loading() {
  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <div className="border-b border-border pb-5">
        <div className="h-4 w-16 animate-pulse rounded bg-surface-muted" />
        <div className="mt-2 h-8 w-64 animate-pulse rounded bg-surface-muted" />
        <div className="mt-3 h-4 w-96 animate-pulse rounded bg-surface-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border border-border bg-surface px-4 py-3">
            <div className="h-8 w-12 animate-pulse rounded bg-surface-muted" />
            <div className="mt-2 h-4 w-20 animate-pulse rounded bg-surface-muted" />
          </div>
        ))}
      </div>
      <div className="border border-border bg-surface p-5">
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
              <div className="flex gap-2">
                <div className="h-6 w-16 animate-pulse rounded bg-surface-muted" />
                <div className="h-6 w-12 animate-pulse rounded bg-surface-muted" />
              </div>
              <div className="mt-2 h-5 w-3/4 animate-pulse rounded bg-surface-muted" />
              <div className="mt-2 h-4 w-full animate-pulse rounded bg-surface-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
