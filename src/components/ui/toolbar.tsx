import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Sticky filter bar for list pages. The old Sources bar was a flex-wrap row of
 * seven controls next to a primary button: it collapsed below 1280px and never
 * showed which filters were active. Here the always-visible part stays small
 * (search + active chips) and the rest folds into a disclosure.
 */
export function Toolbar({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="search"
      aria-label={label}
      className={cn(
        "sticky top-0 z-20 -mx-1 grid gap-3 rounded-lg border border-border bg-surface/95 px-4 py-3 shadow-sm backdrop-blur",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Collapsed advanced filters. A native <details> so it works without client
 * JavaScript — these pages are server components and the filter form submits
 * with a plain GET.
 *
 * `open` should be true when any of the folded filters is active, otherwise the
 * user cannot see what is narrowing their results.
 */
export function ToolbarDisclosure({
  summary = "Filters",
  open = false,
  children,
  className,
}: {
  summary?: ReactNode;
  open?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details open={open} className={cn("group", className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        {summary}
        <span className="text-xs text-muted group-open:hidden">show</span>
        <span className="hidden text-xs text-muted group-open:inline">hide</span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

export type FilterChip = {
  /** What the filter is, e.g. "Provider". */
  label: string;
  /** What it is set to, e.g. "Claude". */
  value: string;
  /** Same page with this one parameter dropped. */
  removeHref: string;
};

/**
 * Active filters, each removable on its own. Without this the only way to
 * change one filter was to reset all of them.
 */
export function FilterChips({
  chips,
  clearHref,
  className,
}: {
  chips: FilterChip[];
  /** Shown once two or more filters are active. */
  clearHref?: string;
  className?: string;
}) {
  if (!chips.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <span
          key={`${chip.label}:${chip.value}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 pl-3 pr-1 text-xs text-primary sm:h-8"
        >
          <span className="text-muted-foreground">{chip.label}</span>
          <span className="font-medium">{chip.value}</span>
          <Link
            href={chip.removeHref}
            aria-label={`Remove filter ${chip.label}: ${chip.value}`}
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors duration-150 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </span>
      ))}
      {clearHref && chips.length > 1 ? (
        <Link
          href={clearHref}
          className="inline-flex h-9 cursor-pointer items-center rounded-full px-3 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-8"
        >
          Clear all
        </Link>
      ) : null}
    </div>
  );
}
