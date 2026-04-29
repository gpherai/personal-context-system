import Link from "next/link";

import type { EntryRecord } from "@/repositories/context-repository";
import { formatDate, labelize } from "@/lib/format";

import { Badge } from "./ui/badge";
import { EmptyState } from "./empty-state";

function privacyTone(privacy: EntryRecord["privacyLevel"]) {
  if (privacy === "sensitive") {
    return "amber" as const;
  }
  if (privacy === "shareable") {
    return "teal" as const;
  }
  return "neutral" as const;
}

export function EntryList({ entries }: { entries: EntryRecord[] }) {
  if (!entries.length) {
    return <EmptyState title="No entries yet" body="Capture the first thought, question, or project note." />;
  }

  return (
    <div className="divide-y divide-border border border-border bg-surface">
      {entries.map((entry) => (
        <article key={entry.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_auto] md:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">{labelize(entry.type)}</Badge>
              <Badge>{entry.status}</Badge>
              <Badge tone={privacyTone(entry.privacyLevel)}>{entry.privacyLevel}</Badge>
            </div>
            <Link
              className="mt-2 block text-base font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              href={`/entries/${entry.id}`}
            >
              {entry.title}
            </Link>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {entry.summary || entry.body}
            </p>
            {(entry.themes.length > 0 || entry.projects.length > 0) && (
              <p className="mt-2 text-xs text-muted-foreground">
                {[...entry.projects.map((project) => project.name), ...entry.themes.map((theme) => theme.name)].join(
                  " / "
                )}
              </p>
            )}
          </div>
          <div className="text-sm text-muted-foreground md:text-right">
            <div>{formatDate(entry.occurredAt ?? entry.capturedAt)}</div>
            <div className="mt-1 text-xs">captured {formatDate(entry.capturedAt)}</div>
          </div>
        </article>
      ))}
    </div>
  );
}
