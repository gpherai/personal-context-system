import { notFound } from "next/navigation";

import { isRecoverableReadError } from "@/application/errors";
import { getEntryById } from "@/application/query-service";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, labelize } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const entry = await getEntryById(id);

    if (!entry) {
      notFound();
    }

    return (
      <article className="mx-auto grid max-w-4xl gap-6">
        <header className="border-b border-border pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="blue">{labelize(entry.type)}</Badge>
            <Badge>{entry.status}</Badge>
            <Badge tone={entry.privacyLevel === "sensitive" ? "amber" : "neutral"}>{entry.privacyLevel}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-semibold">{entry.title}</h1>
          <dl className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="font-medium text-foreground">Captured</dt>
              <dd>{formatDateTime(entry.capturedAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Occurred</dt>
              <dd>{formatDateTime(entry.occurredAt)}</dd>
            </div>
          </dl>
        </header>

        {entry.summary && (
          <section className="border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">Summary</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.summary}</p>
          </section>
        )}

        <section className="border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Body</h2>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-7">{entry.body}</div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">Themes</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {entry.themes.length ? (
                entry.themes.map((theme) => <Badge key={theme.id}>{theme.name}</Badge>)
              ) : (
                <p className="text-sm text-muted-foreground">No themes linked.</p>
              )}
            </div>
          </div>
          <div className="border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">Projects</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {entry.projects.length ? (
                entry.projects.map((project) => <Badge key={project.id}>{project.name}</Badge>)
              ) : (
                <p className="text-sm text-muted-foreground">No projects linked.</p>
              )}
            </div>
          </div>
        </section>

        <section className="border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Provenance</h2>
          <dl className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="font-medium text-foreground">Source</dt>
              <dd>{entry.source ?? "Not specified"}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Confidence</dt>
              <dd>{entry.confidence ?? "Not specified"}</dd>
            </div>
          </dl>
        </section>
      </article>
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
