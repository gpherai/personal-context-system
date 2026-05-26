export default function Loading() {
  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <div className="border-b border-border pb-5">
        <div className="h-3.5 w-12 animate-pulse rounded-full bg-surface-muted" />
        <div className="mt-3 h-7 w-56 animate-pulse rounded-lg bg-surface-muted" />
        <div className="mt-3 h-3.5 w-80 animate-pulse rounded-full bg-surface-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface px-4 py-4 shadow-sm">
            <div className="h-8 w-10 animate-pulse rounded-md bg-surface-muted" />
            <div className="mt-2 h-3.5 w-16 animate-pulse rounded-full bg-surface-muted" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-t border-border px-5 py-4 first:border-t-0">
            <div className="flex gap-1.5">
              <div className="h-5 w-14 animate-pulse rounded-full bg-surface-muted" />
              <div className="h-5 w-10 animate-pulse rounded-full bg-surface-muted" />
            </div>
            <div className="mt-2.5 h-4 w-3/4 animate-pulse rounded-full bg-surface-muted" />
            <div className="mt-1.5 h-3.5 w-full animate-pulse rounded-full bg-surface-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
