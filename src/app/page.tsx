import Link from "next/link";
import { ArrowRight, CircleHelp, Layers, PenLine } from "lucide-react";

import { isRecoverableReadError } from "@/application/errors";
import { getDashboardOverview } from "@/application/query-service";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import type { DashboardOverview } from "@/repositories/context-repository";

export const dynamic = "force-dynamic";

type DashboardLoad =
  | { kind: "ready"; overview: DashboardOverview }
  | { kind: "setup" };

async function loadDashboard(): Promise<DashboardLoad> {
  try {
    return { kind: "ready", overview: await getDashboardOverview() };
  } catch (error) {
    if (isRecoverableReadError(error)) return { kind: "setup" };
    throw error;
  }
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-border bg-surface p-4 shadow-sm transition-all duration-150 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <div className="text-3xl font-bold tabular-nums text-foreground">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </Link>
  );
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
    <div className="mx-auto grid max-w-7xl gap-8">
      <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Today</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Context</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Current work, active questions, and recent capture from the local database.
          </p>
        </div>
        <Link
          href="/capture"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <PenLine className="h-4 w-4" aria-hidden="true" />
          Capture
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="System counts">
        <Stat label="Entries"        value={overview.counts.entries}       href="/ledger"  />
        <Stat label="Question queue" value={overview.counts.openQuestions} href="/cabinet" />
        <Stat label="Themes"         value={overview.counts.themes}        href="/cabinet" />
        <Stat label="Projects"       value={overview.counts.projects}      href="/cabinet" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">Recent entries</h2>
            <Link
              href="/ledger"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
            >
              Ledger <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <EntryList entries={overview.recentEntries} />
        </div>

        <aside className="grid content-start gap-4">
          <section className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CircleHelp className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Question queue</h2>
            </div>
            <div className="space-y-3">
              {overview.openQuestions.length ? (
                overview.openQuestions.map((question) => (
                  <Link
                    key={question.id}
                    href={`/questions/${question.id}`}
                    className="block border-t border-border pt-3 transition-colors first:border-t-0 first:pt-0 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
                  >
                    <Badge tone="amber">{question.status}</Badge>
                    <p className="mt-1.5 text-sm leading-relaxed">{question.prompt}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No tracked questions yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Active projects</h2>
            </div>
            <div className="space-y-1">
              {overview.activeProjects.length ? (
                overview.activeProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.slug}`}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <span>{project.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {project.count ?? 0}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
