import Link from "next/link";
import { ArrowRight, CircleHelp, Layers, PenLine } from "lucide-react";

import { isDatabaseUnavailable } from "@/application/errors";
import { getDashboardOverview } from "@/application/query-service";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { Badge, ButtonLink, PageHeader, Panel, PanelTitle, Stat } from "@/components/ui";
import type { DashboardOverview } from "@/repositories/context-repository";
import { labelize } from "@/lib/format";

export const dynamic = "force-dynamic";

type DashboardLoad =
  | { kind: "ready"; overview: DashboardOverview }
  | { kind: "setup" };

async function loadDashboard(): Promise<DashboardLoad> {
  try {
    return { kind: "ready", overview: await getDashboardOverview() };
  } catch (error) {
    if (isDatabaseUnavailable(error)) return { kind: "setup" };
    throw error;
  }
}

export default async function DashboardPage() {
  const load = await loadDashboard();

  if (load.kind === "setup") {
    return (
      <div className="mx-auto max-w-xl">
        <SetupNotice />
      </div>
    );
  }

  const { overview } = load;

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader
        eyebrow="Today"
        title="Context"
        description="Current work, active questions, and recent capture from the local database."
        actions={
          <ButtonLink href="/capture" variant="primary">
            <PenLine className="h-4 w-4" aria-hidden="true" />
            Capture
          </ButtonLink>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="System counts">
        <Stat label="Entries"        value={overview.counts.entries}       href="/ledger"  />
        <Stat label="Open questions" value={overview.counts.openQuestions} href="/cabinet" />
        <Stat label="Themes"         value={overview.counts.themes}        href="/cabinet" />
        <Stat label="Projects"       value={overview.counts.projects}      href="/cabinet" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">Recent entries</h2>
            <Link
              href="/ledger"
              className="inline-flex items-center gap-1 rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Ledger <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <EntryList entries={overview.recentEntries} />
        </div>

        <aside className="grid content-start gap-4">
          <Panel pad="sm">
            <PanelTitle icon={<CircleHelp className="h-4 w-4 text-primary" aria-hidden="true" />}>
              Question queue
            </PanelTitle>
            <div className="grid gap-3">
              {overview.openQuestions.length ? (
                overview.openQuestions.map((question) => (
                  <Link
                    key={question.id}
                    href={`/questions/${question.id}`}
                    className="block cursor-pointer rounded border-t border-border pt-3 transition-colors duration-150 first:border-t-0 first:pt-0 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <Badge tone="amber">{labelize(question.status)}</Badge>
                    <p className="mt-1.5 text-sm leading-relaxed">{question.prompt}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No tracked questions yet.</p>
              )}
            </div>
          </Panel>

          <Panel pad="sm">
            <PanelTitle icon={<Layers className="h-4 w-4 text-accent" aria-hidden="true" />}>
              Active projects
            </PanelTitle>
            <div className="grid gap-1">
              {overview.activeProjects.length ? (
                overview.activeProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.slug}`}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <span>{project.name}</span>
                    <span data-numeric="" className="font-mono text-xs text-muted-foreground">
                      {project.entryCount ?? 0}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              )}
            </div>
          </Panel>
        </aside>
      </section>
    </div>
  );
}
