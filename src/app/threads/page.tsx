import { isDatabaseUnavailable } from "@/application/errors";
import { getThreads } from "@/application/query-service";
import { EmptyState } from "@/components/empty-state";
import { SetupNotice } from "@/components/setup-notice";
import { Badge, DataList, DataRow, DataTitle, PageHeader } from "@/components/ui";
import { formatDateTime, labelize } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ThreadsPage() {
  try {
    const threads = await getThreads();

    return (
      <div className="mx-auto grid max-w-6xl gap-6">
        <PageHeader
          eyebrow="Threads"
          title="Curated thought sequences"
          description="Threads collect entries into a deliberate sequence once a line of thought becomes durable."
        />

        {threads.length ? (
          <DataList label="Threads">
            {threads.map((thread) => (
              <DataRow key={thread.id} href={`/threads/${thread.slug}`}>
                <DataTitle secondary={thread.description}>{thread.title}</DataTitle>
                <Badge>{labelize(thread.status)}</Badge>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {formatDateTime(thread.updatedAt)}
                </span>
              </DataRow>
            ))}
          </DataList>
        ) : (
          <EmptyState title="No threads" body="Create a thread from the detail page of an entry." />
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
