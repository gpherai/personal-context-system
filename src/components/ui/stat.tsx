import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * A single number with its label. Replaces three separate Stat definitions
 * (dashboard, map, cabinet's CountLink) that had drifted in size and hover
 * behaviour.
 *
 * The value is mono with tabular figures so stat rows line up column-wise,
 * which the old sans version did not do.
 */
export function Stat({
  label,
  value,
  href,
  hint,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  /** When set the whole tile becomes a link. */
  href?: string;
  hint?: ReactNode;
  className?: string;
}) {
  const body = (
    <>
      <div className="font-mono text-3xl font-medium tabular-nums text-foreground">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      {hint ? <div className="mt-0.5 text-xs text-muted">{hint}</div> : null}
    </>
  );

  const base = "rounded-lg border border-border bg-surface p-4 shadow-sm";

  if (!href) {
    return <div className={cn(base, className)}>{body}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(
        base,
        "block cursor-pointer transition-colors duration-150 hover:border-primary/30 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        className
      )}
    >
      {body}
    </Link>
  );
}
