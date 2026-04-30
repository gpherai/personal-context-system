import { notFound } from "next/navigation";

import { isRecoverableReadError } from "@/application/errors";
import { getThreadBySlug } from "@/application/query-service";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

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
          <Badge>{thread.status}</Badge>
          <h1 className="mt-3 text-3xl font-semibold">{thread.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Updated {formatDateTime(thread.updatedAt)}</p>
          {thread.description && <p className="mt-3 text-sm leading-6 text-muted-foreground">{thread.description}</p>}
        </header>

        <EntryList entries={thread.entries} />
      </div>
    );
  } catch (error) {
    if (isRecoverableReadError(error)) {
      return (
        <div className="mx-auto max-w-4xl">
          <SetupNotice />
        </div>
      );
    }

    throw error;
  }
}
