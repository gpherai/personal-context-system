import Link from "next/link";
import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Dense row list — the archive's main reading surface for 811 sources and the
 * ledger. A bordered container with hairline-separated rows, not a card per
 * item: at this record count a card grid costs about four rows of vertical
 * space per record and hides the date, which is the primary axis.
 */
export function DataList({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  /** aria-label for the list region when it has no visible heading. */
  label?: string;
}) {
  return (
    <div
      aria-label={label}
      role={label ? "group" : undefined}
      className={cn(
        // No overflow-hidden: that would turn this into the nearest scroll
        // container and DataGroupHeader's sticky would never fire. Corners are
        // clipped per row instead, so hover backgrounds still respect them.
        "rounded-lg border border-border bg-surface shadow-sm",
        "[&>*:first-child]:rounded-t-lg [&>*:last-child]:rounded-b-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Sticky group heading inside a DataList — month headers on /sources, status
 * groups elsewhere. Sticks to the top of the scroll container so the reader
 * never loses which month they are in while scrolling 121 July conversations.
 */
export function DataGroupHeader({
  children,
  count,
  className,
}: {
  children: ReactNode;
  count?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex items-baseline justify-between gap-3 border-b border-border bg-surface-muted px-4 py-2",
        className
      )}
    >
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {children}
      </h3>
      {count != null ? (
        <span className="font-mono text-xs tabular-nums text-muted">{count}</span>
      ) : null}
    </div>
  );
}

/**
 * One row. Pass `href` to make the whole row navigable; without it the row is
 * a plain container and any links live inside it.
 *
 * Rows are min-h-14 so they clear the 44px touch target on their own.
 */
export function DataRow({
  href,
  as = "div",
  children,
  className,
}: {
  href?: string;
  as?: ElementType;
  children: ReactNode;
  className?: string;
}) {
  const base =
    "flex min-h-14 items-baseline gap-3 border-t border-border px-4 py-3 text-sm first:border-t-0";

  if (!href) {
    const Tag = as;
    return <Tag className={cn(base, className)}>{children}</Tag>;
  }

  return (
    <Link
      href={href}
      className={cn(
        base,
        "cursor-pointer transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
        className
      )}
    >
      {children}
    </Link>
  );
}

/** Fixed-width mono cell for dates, counts and ids, so columns align. */
export function DataCell({
  children,
  align = "left",
  width,
  className,
}: {
  children: ReactNode;
  align?: "left" | "right";
  /** Tailwind width utility, e.g. "w-20". Omit for auto width. */
  width?: string;
  className?: string;
}) {
  return (
    <span
      data-numeric=""
      className={cn(
        "shrink-0 font-mono text-xs text-muted-foreground",
        align === "right" && "text-right",
        width,
        className
      )}
    >
      {children}
    </span>
  );
}

/** The row's primary text: truncating title plus optional secondary line. */
export function DataTitle({
  children,
  secondary,
  className,
}: {
  children: ReactNode;
  secondary?: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("min-w-0 flex-1", className)}>
      <span className="block truncate font-medium text-foreground">{children}</span>
      {secondary ? (
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{secondary}</span>
      ) : null}
    </span>
  );
}
