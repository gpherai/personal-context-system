import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border border-border bg-surface p-8 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">404</p>
        <h1 className="mt-2 text-xl font-semibold text-foreground">Not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The requested context record does not exist.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
