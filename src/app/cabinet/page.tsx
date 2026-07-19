import Link from "next/link";
import { Archive, BookMarked, BookOpen, CircleHelp, Layers, Library, Rows3 } from "lucide-react";

import { isDatabaseUnavailable } from "@/application/errors";
import { getCabinetOverview } from "@/application/query-service";
import { EntryList } from "@/components/entry-list";
import { EmptyState } from "@/components/empty-state";
import { SetupNotice } from "@/components/setup-notice";
import { Badge, PageHeader, Panel, PanelTitle } from "@/components/ui";
import { entryTypeDetails, sourceTypeDetails } from "@/domain/taxonomy";
import { labelize } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Label + count row. Deliberately a row and not a <Stat> tile: these are
 *  facet links in a narrow column, where a tile would cost four times the
 *  vertical space for the same number. */
function CountLink({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <Link
      href={href}
      className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <span>{label}</span>
      <Badge>{count}</Badge>
    </Link>
  );
}

export default async function CabinetPage() {
  try {
    const cabinet = await getCabinetOverview();

    return (
      <div className="mx-auto grid max-w-6xl gap-6">
        <PageHeader
          eyebrow="Cabinet"
          title="Structured archive"
          description="Browse context by records that have become durable enough to navigate."
        />

        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Panel pad="sm">
            <PanelTitle icon={<Rows3 className="h-4 w-4 text-primary" aria-hidden="true" />}>
              Entries by type
            </PanelTitle>
            <div className="grid gap-1 sm:grid-cols-2">
              {cabinet.entryTypes.map((summary) => (
                <CountLink
                  key={summary.type}
                  href={`/ledger?type=${summary.type}`}
                  label={entryTypeDetails[summary.type].label}
                  count={summary.count}
                />
              ))}
            </div>
          </Panel>

          <Panel pad="sm">
            <PanelTitle icon={<Archive className="h-4 w-4 text-accent" aria-hidden="true" />}>
              Entries by status
            </PanelTitle>
            <div className="grid gap-1">
              {cabinet.entryStatuses.map((summary) => (
                <CountLink
                  key={summary.status}
                  href={`/ledger?status=${summary.status}`}
                  label={labelize(summary.status)}
                  count={summary.count}
                />
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <Panel pad="sm">
            <PanelTitle icon={<Library className="h-4 w-4 text-accent" aria-hidden="true" />}>
              Themes
            </PanelTitle>
            <div className="grid gap-1">
              {cabinet.themes.length ? (
                cabinet.themes.map((theme) => (
                  <Link
                    key={theme.id}
                    href={`/themes/${theme.slug}`}
                    className="flex min-h-11 cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <span>{theme.name}</span>
                    <Badge>{theme.entryCount ?? 0}</Badge>
                  </Link>
                ))
              ) : (
                <EmptyState title="No themes" body="Themes appear when entries are captured with theme names." />
              )}
            </div>
          </Panel>

          <Panel pad="sm">
            <PanelTitle icon={<Layers className="h-4 w-4 text-primary" aria-hidden="true" />}>
              Projects
            </PanelTitle>
            <div className="grid gap-1">
              {cabinet.projects.length ? (
                cabinet.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.slug}`}
                    className="flex min-h-11 cursor-pointer items-center justify-between rounded-md px-2 py-2 text-sm transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <span>{project.name}</span>
                    <Badge>{project.entryCount ?? 0}</Badge>
                  </Link>
                ))
              ) : (
                <EmptyState title="No projects" body="Projects appear when entries are captured with project names." />
              )}
            </div>
          </Panel>

          <Panel pad="sm">
            <PanelTitle icon={<CircleHelp className="h-4 w-4 text-caution" aria-hidden="true" />}>
              Questions
            </PanelTitle>
            <div className="grid gap-3">
              {cabinet.questions.length ? (
                cabinet.questions.map((question) => (
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
                <EmptyState title="No questions" body="Question entries create separate tracked question records." />
              )}
            </div>
          </Panel>

          <Panel pad="sm">
            <PanelTitle icon={<BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />}>
              Threads
            </PanelTitle>
            <div className="grid gap-1">
              {cabinet.threads.length ? (
                cabinet.threads.map((thread) => (
                  <Link
                    key={thread.id}
                    href={`/threads/${thread.slug}`}
                    className="block min-h-11 cursor-pointer rounded-md px-2 py-2 text-sm transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    {thread.title}
                  </Link>
                ))
              ) : (
                <EmptyState title="No threads" body="Threads appear when entries are composed into sequences." />
              )}
            </div>
          </Panel>
        </section>

        <Panel pad="sm">
          <PanelTitle
            icon={<BookMarked className="h-4 w-4 text-primary" aria-hidden="true" />}
            action={
              <Link
                href="/sources"
                className="rounded text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {cabinet.sourceCount} total →
              </Link>
            }
          >
            Sources
          </PanelTitle>
          {cabinet.sourceCount > 0 ? (
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
              {cabinet.sourceTypes
                .filter((s) => s.count > 0)
                .map((s) => (
                  <CountLink
                    key={s.type}
                    href={`/sources?type=${s.type}`}
                    label={sourceTypeDetails[s.type].label}
                    count={s.count}
                  />
                ))}
            </div>
          ) : (
            <EmptyState title="No sources" body="Sources appear here once they are created." />
          )}
        </Panel>

        <section className="grid gap-4">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-base font-semibold text-foreground">Archived entries</h2>
          </div>
          {cabinet.archivedEntries.length ? (
            <EntryList entries={cabinet.archivedEntries} />
          ) : (
            <EmptyState title="No archived entries" body="Archived entries appear here after their status is changed." />
          )}
        </section>
      </div>
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return (
        <div className="mx-auto max-w-xl">
          <SetupNotice />
        </div>
      );
    }
    throw error;
  }
}
