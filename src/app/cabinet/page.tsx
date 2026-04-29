import Link from "next/link";
import { Archive, CircleHelp, Layers, Library } from "lucide-react";

import { isRecoverableReadError } from "@/application/errors";
import { getDashboardOverview } from "@/application/query-service";
import { EntryList } from "@/components/entry-list";
import { EmptyState } from "@/components/empty-state";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CabinetPage() {
  try {
    const overview = await getDashboardOverview();

    return (
      <div className="mx-auto grid max-w-7xl gap-6">
        <header className="border-b border-border pb-5">
          <p className="text-sm font-medium text-primary">Cabinet</p>
          <h1 className="mt-1 text-3xl font-semibold">Structured archive</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Browse context by records that have become durable enough to navigate.
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-3">
          <div className="border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <Library className="h-4 w-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Themes</h2>
            </div>
            <div className="grid gap-2">
              {overview.activeThemes.length ? (
                overview.activeThemes.map((theme) => (
                  <Link
                    key={theme.id}
                    href={`/themes/${theme.slug}`}
                    className="flex items-center justify-between rounded-md px-2 py-2 text-sm transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                  >
                    <span>{theme.name}</span>
                    <Badge>{theme.count ?? 0}</Badge>
                  </Link>
                ))
              ) : (
                <EmptyState title="No themes" body="Themes appear when entries are captured with theme names." />
              )}
            </div>
          </div>

          <div className="border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Projects</h2>
            </div>
            <div className="grid gap-2">
              {overview.activeProjects.length ? (
                overview.activeProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.slug}`}
                    className="flex items-center justify-between rounded-md px-2 py-2 text-sm transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                  >
                    <span>{project.name}</span>
                    <Badge>{project.count ?? 0}</Badge>
                  </Link>
                ))
              ) : (
                <EmptyState title="No projects" body="Projects appear when entries are captured with project names." />
              )}
            </div>
          </div>

          <div className="border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <CircleHelp className="h-4 w-4 text-caution" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Questions</h2>
            </div>
            <div className="grid gap-3">
              {overview.openQuestions.length ? (
                overview.openQuestions.map((question) => (
                  <div key={question.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                    <Badge tone="amber">{question.status}</Badge>
                    <p className="mt-2 text-sm leading-6">{question.prompt}</p>
                  </div>
                ))
              ) : (
                <EmptyState title="No questions" body="Question entries create first-class question records." />
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-3">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Recent archive entries</h2>
          </div>
          <EntryList entries={overview.recentEntries} />
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
