import type { EntryListItem } from "@/repositories/context-repository";
import { formatDate, labelize } from "@/lib/format";

import { Badge, DataCell, DataList, DataRow, DataTitle } from "./ui";
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
        title="No entries yet"
        body="Capture your first thought, question, or project note."
      />
    );
  }

  return (
    <DataList label="Entries">
      {entries.map((entry) => {
        const context = [
          ...entry.projects.map((p) => p.name),
          ...entry.themes.map((t) => t.name),
        ].join(" · ");

        return (
          <DataRow key={entry.id} href={`/entries/${entry.id}`} className="items-start">
            <DataCell width="w-16">{formatDate(entry.occurredAt ?? entry.capturedAt)}</DataCell>
            <DataTitle
              secondary={
                <>
                  {entry.summary || entry.body}
                  {context ? <span className="text-muted"> — {context}</span> : null}
                </>
              }
            >
              {entry.title}
            </DataTitle>
            <span className="hidden shrink-0 flex-wrap items-center gap-1.5 sm:flex">
              <Badge tone="blue">{labelize(entry.type)}</Badge>
              <Badge>{labelize(entry.status)}</Badge>
              <Badge tone={privacyTone(entry.privacyLevel)}>{labelize(entry.privacyLevel)}</Badge>
            </span>
          </DataRow>
        );
      })}
    </DataList>
  );
}
