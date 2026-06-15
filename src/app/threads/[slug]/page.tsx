import Link from "next/link";
import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { getThreadBySlug } from "@/application/query-service";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { deleteThreadAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const thread = await getThreadBySlug(slug);

    if (!thread) {
      notFound();
    }

    return (
      <div className="mx-auto grid max-w-5xl gap-5">
        <header className="border-b border-border pb-5">
          <div className="flex items-start justify-between gap-4">
            <Link
              href="/threads"
              className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              ← Draden
            </Link>
            <form
              action={deleteThreadAction.bind(null, thread.id)}
              onSubmit={(e) => {
                if (!confirm(`Draad "${thread.title}" permanent verwijderen?`)) e.preventDefault();
              }}
            >
              <button
                type="submit"
                className="inline-flex h-8 items-center justify-center rounded-md border border-danger/30 bg-danger/8 px-3 text-xs font-medium text-danger transition-colors duration-200 hover:bg-danger/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
              >
                Verwijderen
              </button>
            </form>
          </div>
          <div className="mt-3">
            <Badge>{thread.status}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{thread.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Bijgewerkt {formatDateTime(thread.updatedAt)}</p>
          {thread.description && <p className="mt-3 text-sm leading-6 text-muted-foreground">{thread.description}</p>}
        </header>

        <EntryList entries={thread.entries} />
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
