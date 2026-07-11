import Link from "next/link";
import { Layers, Library, MessageSquareText } from "lucide-react";

import { isDatabaseUnavailable } from "@/application/errors";
import { getGraphSnapshot } from "@/application/query-service";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { sourceTypeDetails } from "@/domain/taxonomy";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3 shadow-sm">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export default async function MapPage() {
  try {
    const snapshot = await getGraphSnapshot();

    const sourcesByType = snapshot.sources.reduce<Record<string, number>>((acc, s) => {
      acc[s.type] = (acc[s.type] ?? 0) + 1;
      return acc;
    }, {});

    return (
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="border-b border-border pb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Map</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Relationship map</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            A structured map of explicit links. It stays text-first until enough relationship data exists for a visual graph.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Graph counts">
          <Stat label="Entries" value={snapshot.entries.length} />
          <Stat label="Themes" value={snapshot.themes.length} />
          <Stat label="Projects" value={snapshot.projects.length} />
          <Stat label="Questions" value={snapshot.questions.length} />
          <Stat label="Sources" value={snapshot.sources.length} />
        </section>

        {snapshot.sources.length > 0 && (
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="mb-2 text-sm font-semibold">Sources by type</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(sourcesByType).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                <Link
                  key={type}
                  href={`/sources?type=${type}`}
                  className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-medium transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {sourceTypeDetails[type as keyof typeof sourceTypeDetails]?.label ?? type}
                  <Badge tone="neutral">{count}</Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {snapshot.themes.length > 0 && (
              <section className="rounded-lg border border-border bg-surface p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Library className="h-4 w-4 text-accent" aria-hidden="true" />
                  <h2 className="text-sm font-semibold">Themes</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {snapshot.themes.map((theme) => (
                    <Link key={theme.id} href={`/themes/${theme.slug}`} className="transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-md">
                      <Badge tone="teal">{theme.name}</Badge>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-lg border border-border bg-surface p-4 shadow-sm">
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
                      className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      {project.name}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No projects yet.</p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-surface p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-caution" aria-hidden="true" />
                <h2 className="text-sm font-semibold">Question queue</h2>
              </div>
              <div className="grid gap-2">
                {snapshot.questions.length ? (
                  snapshot.questions.slice(0, 8).map((question) => (
                    <Link
                      key={question.id}
                      href={`/questions/${question.id}`}
                      className="text-sm leading-6 text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      {question.prompt}
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No questions yet.</p>
                )}
              </div>
            </section>
        </section>
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
