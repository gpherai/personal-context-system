import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";

import { isDatabaseUnavailable } from "@/application/errors";
import { getEntryOptions, getThreadBySlug } from "@/application/query-service";
import { DeleteForm } from "@/components/delete-form";
import { EmptyState } from "@/components/empty-state";
import { SetupNotice } from "@/components/setup-notice";
import { Badge, DetailHeader, Panel, PanelTitle } from "@/components/ui";
import { formatDate, formatDateTime, labelize } from "@/lib/format";
import { deleteThreadAction, moveEntryInThreadAction } from "./actions";
import { AddEntryToThreadForm } from "./thread-forms";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const thread = await getThreadBySlug(slug);

    if (!thread) {
      notFound();
    }

    const entryOptions = await getEntryOptions();
    const threadEntryIds = new Set(thread.entries.map((entry) => entry.id));
    const availableEntries = entryOptions
      .filter((entry) => !threadEntryIds.has(entry.id))
      .map((entry) => ({ id: entry.id, title: entry.title }));

    return (
      <div className="mx-auto grid max-w-4xl gap-6">
        <DetailHeader
          backHref="/threads"
          backLabel="Threads"
          badges={<Badge>{labelize(thread.status)}</Badge>}
          title={thread.title}
          description={thread.description}
          meta={<>Updated {formatDateTime(thread.updatedAt)}</>}
          actions={
            <DeleteForm
              action={deleteThreadAction.bind(null, thread.id)}
              title="Delete thread"
              message={`Permanently delete the thread "${thread.title}"? This cannot be undone.`}
              triggerLabel="Delete"
            />
          }
        />

        {thread.entries.length ? (
          <ol className="grid gap-2">
            {thread.entries.map((entry, index) => (
              <Panel
                as="li"
                key={entry.id}
                pad="none"
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <form action={moveEntryInThreadAction.bind(null, thread.slug, thread.id, entry.id, "up")}>
                    <button
                      type="submit"
                      disabled={index === 0}
                      aria-label="Move up"
                      className="flex h-11 w-11 items-center justify-center rounded-md border border-border transition-colors duration-150 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </form>
                  <form action={moveEntryInThreadAction.bind(null, thread.slug, thread.id, entry.id, "down")}>
                    <button
                      type="submit"
                      disabled={index === thread.entries.length - 1}
                      aria-label="Move down"
                      className="flex h-11 w-11 items-center justify-center rounded-md border border-border transition-colors duration-150 hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </form>
                </div>
                <Link
                  href={`/entries/${entry.id}`}
                  className="min-w-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-md"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="blue">{labelize(entry.type)}</Badge>
                    <Badge>{labelize(entry.status)}</Badge>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-semibold text-foreground hover:text-primary hover:underline">
                    {entry.title}
                  </p>
                </Link>
                <div className="shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {formatDate(entry.occurredAt ?? entry.capturedAt)}
                </div>
              </Panel>
            ))}
          </ol>
        ) : (
          <EmptyState title="No entries yet" body="Add an existing entry to this thread." />
        )}

        <Panel>
          <PanelTitle>Add entry</PanelTitle>
          <AddEntryToThreadForm threadSlug={thread.slug} threadId={thread.id} entryOptions={availableEntries} />
        </Panel>
      </div>
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return (
        <div className="mx-auto max-w-4xl">
          <SetupNotice />
        </div>
      );
    }

    throw error;
  }
}
