import Link from "next/link";

import { isDatabaseUnavailable } from "@/application/errors";
import { getThreads } from "@/application/query-service";
import { EmptyState } from "@/components/empty-state";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ThreadsPage() {
  try {
    const threads = await getThreads();

    return (
      <div className="mx-auto grid max-w-5xl gap-6">
        <header className="border-b border-border pb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Threads</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Curated thought sequences</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Threads collect entries into a deliberate sequence once a line of thought becomes durable.
          </p>
        </header>

        {threads.length ? (
          <section className="divide-y divide-border border border-border bg-surface">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/threads/${thread.slug}`}
                className="grid gap-2 px-5 py-4 transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{thread.status}</Badge>
                  <span className="text-xs text-muted-foreground">Updated {formatDateTime(thread.updatedAt)}</span>
                </div>
                <h2 className="text-base font-semibold">{thread.title}</h2>
                {thread.description && <p className="text-sm leading-6 text-muted-foreground">{thread.description}</p>}
              </Link>
            ))}
          </section>
        ) : (
          <EmptyState title="No threads" body="Create a thread from an entry detail page." />
        )}
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
