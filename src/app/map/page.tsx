import Link from "next/link";
import { GitBranch, Layers, Library, MessageSquareText } from "lucide-react";

import { isRecoverableReadError } from "@/application/errors";
import { getGraphSnapshot } from "@/application/query-service";
import { EmptyState } from "@/components/empty-state";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { labelize } from "@/lib/format";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border bg-surface px-4 py-3">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export default async function MapPage() {
  try {
    const snapshot = await getGraphSnapshot();

    return (
      <div className="mx-auto grid max-w-7xl gap-6">
        <header className="border-b border-border pb-5">
          <p className="text-sm font-medium text-primary">Map</p>
          <h1 className="mt-1 text-3xl font-semibold">Relationship map</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            A structured map of explicit links. It stays text-first until enough relationship data exists for a visual graph.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Graph counts">
          <Stat label="Entries" value={snapshot.entries.length} />
          <Stat label="Themes" value={snapshot.themes.length} />
          <Stat label="Projects" value={snapshot.projects.length} />
          <Stat label="Questions" value={snapshot.questions.length} />
          <Stat label="Relationships" value={snapshot.relationships.length} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Explicit relationships</h2>
            </div>
            {snapshot.relationships.length ? (
              <div className="divide-y divide-border">
                {snapshot.relationships.map((relationship) => (
                  <article key={relationship.id} className="grid gap-2 py-3 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="blue">{labelize(relationship.relationType)}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {relationship.fromType}:{relationship.fromId} {"->"} {relationship.toType}:{relationship.toId}
                      </span>
                    </div>
                    {relationship.note && <p className="text-sm leading-6 text-muted-foreground">{relationship.note}</p>}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No relationships" body="Create links from entry or question detail pages." />
            )}
          </div>

          <aside className="grid content-start gap-4">
            <section className="border border-border bg-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <Library className="h-4 w-4 text-accent" aria-hidden="true" />
                <h2 className="text-sm font-semibold">Themes</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {snapshot.themes.length ? (
                  snapshot.themes.map((theme) => (
                    <Link key={theme.id} href={`/themes/${theme.slug}`} className="transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 rounded-md">
                      <Badge tone="teal">{theme.name}</Badge>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No themes yet.</p>
                )}
              </div>
            </section>

            <section className="border border-border bg-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-semibold">Projects</h2>
              </div>
              <div className="grid gap-2">
                {snapshot.projects.length ? (
                  snapshot.projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.slug}`}
                      className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                    >
                      {project.name}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No projects yet.</p>
                )}
              </div>
            </section>

            <section className="border border-border bg-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-caution" aria-hidden="true" />
                <h2 className="text-sm font-semibold">Open questions</h2>
              </div>
              <div className="grid gap-2">
                {snapshot.questions.length ? (
                  snapshot.questions.slice(0, 8).map((question) => (
                    <Link
                      key={question.id}
                      href={`/questions/${question.id}`}
                      className="text-sm leading-6 text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                    >
                      {question.prompt}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No questions yet.</p>
                )}
              </div>
            </section>
          </aside>
        </section>
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
