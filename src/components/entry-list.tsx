import Link from "next/link";

import type { EntryListItem } from "@/repositories/context-repository";
import { formatDate, labelize } from "@/lib/format";
import { cn } from "@/lib/cn";

import { Badge } from "./ui/badge";
import { EmptyState } from "./empty-state";

function privacyTone(privacy: EntryListItem["privacyLevel"]) {
  if (privacy === "sensitive") return "amber" as const;
  if (privacy === "shareable") return "teal" as const;
  return "neutral" as const;
}

export function EntryList({ entries }: { entries: EntryListItem[] }) {
  if (!entries.length) {
    return (
      <EmptyState
        title="Nog geen notities"
        body="Leg de eerste gedachte, vraag of projectaantekening vast."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      {entries.map((entry, index) => (
        <article
          key={entry.id}
          className={cn(
            "grid gap-3 px-5 py-4 transition-colors duration-150 hover:bg-surface-muted md:grid-cols-[1fr_auto]",
            index > 0 && "border-t border-border"
          )}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="blue">{labelize(entry.type)}</Badge>
              <Badge>{entry.status}</Badge>
              <Badge tone={privacyTone(entry.privacyLevel)}>{entry.privacyLevel}</Badge>
            </div>
            <Link
              href={`/entries/${entry.id}`}
              className="mt-2 block text-sm font-semibold cursor-pointer text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
            >
              {entry.title}
            </Link>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {entry.summary || entry.body}
            </p>
            {(entry.themes.length > 0 || entry.projects.length > 0) && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {[
                  ...entry.projects.map((p) => p.name),
                  ...entry.themes.map((t) => t.name),
                ].join(" · ")}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right text-xs text-muted-foreground">
            <div className="font-medium">{formatDate(entry.occurredAt ?? entry.capturedAt)}</div>
            <div className="mt-0.5 opacity-70">vastgelegd {formatDate(entry.capturedAt)}</div>
          </div>
        </article>
      ))}
    </div>
  );
}
