import Link from "next/link";
import { Layers, Library, MessageSquareText } from "lucide-react";

import { isDatabaseUnavailable } from "@/application/errors";
import { getGraphSnapshot } from "@/application/query-service";
import { SetupNotice } from "@/components/setup-notice";
import { Badge, PageHeader, Panel, PanelTitle, Stat } from "@/components/ui";
import { sourceTypeDetails } from "@/domain/taxonomy";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  try {
    const snapshot = await getGraphSnapshot();

    const sourcesByType = snapshot.sources.reduce<Record<string, number>>((acc, s) => {
      acc[s.type] = (acc[s.type] ?? 0) + 1;
      return acc;
    }, {});

    return (
      <div className="mx-auto grid max-w-6xl gap-6">
        <PageHeader
          eyebrow="Map"
          title="Relationship map"
          description="A structured map of explicit links. It stays text-first until enough relationship data exists for a visual graph."
        />

        <section className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-label="Graph counts">
          <Stat label="Entries" value={snapshot.entries.length} />
          <Stat label="Themes" value={snapshot.themes.length} />
          <Stat label="Projects" value={snapshot.projects.length} />
          <Stat label="Questions" value={snapshot.questions.length} />
          <Stat label="Sources" value={snapshot.sources.length} />
        </section>

        {snapshot.sources.length > 0 && (
          <Panel>
            <PanelTitle>Sources by type</PanelTitle>
            <div className="flex flex-wrap gap-2">
              {Object.entries(sourcesByType).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                <Link
                  key={type}
                  href={`/sources?type=${type}`}
                  className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs font-medium transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {sourceTypeDetails[type as keyof typeof sourceTypeDetails]?.label ?? type}
                  <Badge tone="neutral">{count}</Badge>
                </Link>
              ))}
            </div>
          </Panel>
        )}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {snapshot.themes.length > 0 && (
            <Panel pad="sm">
              <PanelTitle icon={<Library className="h-4 w-4 text-accent" aria-hidden="true" />}>
                Themes
              </PanelTitle>
              <div className="flex flex-wrap gap-2">
                {snapshot.themes.map((theme) => (
                  <Link
                    key={theme.id}
                    href={`/themes/${theme.slug}`}
                    className="cursor-pointer rounded-md transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <Badge tone="teal">{theme.name}</Badge>
                  </Link>
                ))}
              </div>
            </Panel>
          )}

          <Panel pad="sm">
            <PanelTitle icon={<Layers className="h-4 w-4 text-primary" aria-hidden="true" />}>
              Projects
            </PanelTitle>
            <div className="grid gap-2">
              {snapshot.projects.length ? (
                snapshot.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.slug}`}
                    className="cursor-pointer text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    {project.name}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              )}
            </div>
          </Panel>

          <Panel pad="sm">
            <PanelTitle icon={<MessageSquareText className="h-4 w-4 text-caution" aria-hidden="true" />}>
              Question queue
            </PanelTitle>
            <div className="grid gap-2">
              {snapshot.questions.length ? (
                snapshot.questions.slice(0, 8).map((question) => (
                  <Link
                    key={question.id}
                    href={`/questions/${question.id}`}
                    className="cursor-pointer text-sm leading-6 text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    {question.prompt}
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No questions yet.</p>
              )}
            </div>
          </Panel>
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
