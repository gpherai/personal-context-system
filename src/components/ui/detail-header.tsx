import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Header for a single record — theme, project, question, entry, thread, source.
 * Replaces six near-identical variants that differed only in which optional
 * slot they happened to render.
 *
 * Slot order is fixed on purpose, so every detail page reads the same way:
 * back link · badges · title · description · meta · actions.
 */
export function DetailHeader({
  backHref,
  backLabel,
  badges,
  title,
  description,
  meta,
  actions,
  className,
}: {
  backHref?: string;
  backLabel?: string;
  /** Type / status / privacy badges, rendered above the title. */
  badges?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Dates, counts, aliases — anything secondary below the description. */
  meta?: ReactNode;
  /** Edit / delete / promote controls. */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("border-b border-border pb-6", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-primary transition-colors duration-150 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {backLabel ?? "Back"}
        </Link>
      ) : null}

      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
          backHref && "mt-3"
        )}
      >
        <div className="min-w-0">
          {badges ? <div className="flex flex-wrap items-center gap-2">{badges}</div> : null}
          <h1
            className={cn(
              "font-serif text-3xl font-semibold tracking-tight text-foreground",
              badges && "mt-3"
            )}
          >
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
          {meta ? <div className="mt-2 text-sm text-muted-foreground">{meta}</div> : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
