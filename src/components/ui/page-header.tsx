import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * The single page-level header. Replaces twelve hand-written headers that had
 * drifted apart (`mt-2` vs `mt-1.5`, `pb-6` vs `pb-5`, `leading-relaxed` vs
 * `leading-6`).
 *
 * The title is set in serif: page titles are reading content, the eyebrow and
 * actions around them are interface chrome and stay in sans.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned on md and up, stacked below the title on small screens. */
  actions?: ReactNode;
  /** Extra content below the description — filter summaries, counts. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-6",
        actions && "md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
