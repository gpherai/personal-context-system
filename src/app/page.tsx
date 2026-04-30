import Link from "next/link";
import { ArrowRight, CircleHelp, Layers, Library, PenLine } from "lucide-react";

import { isRecoverableReadError } from "@/application/errors";
import { getDashboardOverview } from "@/application/query-service";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import type { DashboardOverview } from "@/repositories/context-repository";

export const dynamic = "force-dynamic";

type DashboardLoad = { kind: "ready"; overview: DashboardOverview } | { kind: "setup" };

async function loadDashboard(): Promise<DashboardLoad> {
  try {
    return { kind: "ready", overview: await getDashboardOverview() };
  } catch (error) {
    if (isRecoverableReadError(error)) {
      return { kind: "setup" };
    }

    throw error;
  }
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border bg-surface px-4 py-3">
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const load = await loadDashboard();

  if (load.kind === "setup") {
    return (
      <div className="mx-auto max-w-4xl">
        <SetupNotice />
      </div>
    );
  }

  const { overview } = load;

  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Today</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-foreground">Context dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Current entries, questions, projects, and themes from the local database.
          </p>
        </div>
        <Link
          href="/capture"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          <PenLine className="h-4 w-4" aria-hidden="true" />
          Capture
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="System counts">
        <Stat label="Entries" value={overview.counts.entries} />
        <Stat label="Question queue" value={overview.counts.openQuestions} />
        <Stat label="Themes" value={overview.counts.themes} />
        <Stat label="Projects" value={overview.counts.projects} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Recent entries</h2>
            <Link
              href="/ledger"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              Ledger <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <EntryList entries={overview.recentEntries} />
        </div>

        <aside className="grid content-start gap-4">
          <section className="border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <CircleHelp className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Question queue</h2>
            </div>
            <div className="space-y-3">
              {overview.openQuestions.length ? (
                overview.openQuestions.map((question) => (
                  <div key={question.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                    <Badge tone="amber">{question.status}</Badge>
                    <p className="mt-2 text-sm leading-6">{question.prompt}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No tracked questions yet.</p>
              )}
            </div>
          </section>

          <section className="border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Active projects</h2>
            </div>
            <div className="space-y-2">
              {overview.activeProjects.length ? (
                overview.activeProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>{project.name}</span>
                    <span className="text-muted-foreground">{project.count ?? 0}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              )}
            </div>
          </section>

          <section className="border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <Library className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Active themes</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {overview.activeThemes.length ? (
                overview.activeThemes.map((theme) => (
                  <Badge key={theme.id} tone="teal">
                    {theme.name} {theme.count !== undefined ? `(${theme.count})` : ""}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No themes yet.</p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
