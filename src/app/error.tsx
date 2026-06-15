"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border border-border bg-surface p-8 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Error</p>
        <h1 className="mt-2 text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          An unexpected error occurred. Try again or return to the dashboard.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={reset}
            className="inline-flex cursor-pointer items-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center cursor-pointer text-sm font-medium text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
