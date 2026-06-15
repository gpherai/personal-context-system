import Link from "next/link";
import { Archive, BookMarked, BookOpen, CircleHelp, Layers, Library, Rows3 } from "lucide-react";

import { isDatabaseUnavailable } from "@/application/errors";
import { getCabinetOverview } from "@/application/query-service";
import { EntryList } from "@/components/entry-list";
import { EmptyState } from "@/components/empty-state";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { entryTypeDetails, sourceTypeDetails } from "@/domain/taxonomy";
import { labelize } from "@/lib/format";

export const dynamic = "force-dynamic";

function CountLink({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <Link
      href={href}
      className="flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
      <div className="mx-auto grid max-w-7xl gap-8">
        <header className="border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Cabinet</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Structured archive</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Browse context by records that have become durable enough to navigate.
          </p>
        </header>

        <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Rows3 className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Entries by type</h2>
            </div>
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
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Archive className="h-4 w-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Entries by status</h2>
            </div>
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
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Library className="h-4 w-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">{"Thema’s"}</h2>
            </div>
            <div className="grid gap-1">
              {cabinet.themes.length ? (
                cabinet.themes.map((theme) => (
                  <Link
                    key={theme.id}
                    href={`/themes/${theme.slug}`}
                    className="flex items-center justify-between rounded-md px-2 py-2 text-sm transition-colors cursor-pointer hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <span>{theme.name}</span>
                    <Badge>{theme.entryCount ?? 0}</Badge>
                  </Link>
                ))
              ) : (
                <EmptyState title="Geen thema's" body="Thema's verschijnen wanneer notities worden vastgelegd met thema-namen." />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Projecten</h2>
            </div>
            <div className="grid gap-1">
              {cabinet.projects.length ? (
                cabinet.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.slug}`}
                    className="flex items-center justify-between rounded-md px-2 py-2 text-sm transition-colors cursor-pointer hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <span>{project.name}</span>
                    <Badge>{project.entryCount ?? 0}</Badge>
                  </Link>
                ))
              ) : (
                <EmptyState title="Geen projecten" body="Projecten verschijnen wanneer notities worden vastgelegd met projectnamen." />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CircleHelp className="h-4 w-4 text-caution" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Vragen</h2>
            </div>
            <div className="grid gap-3">
              {cabinet.questions.length ? (
                cabinet.questions.map((question) => (
                  <Link
                    key={question.id}
                    href={`/questions/${question.id}`}
                    className="block border-t border-border pt-3 transition-colors first:border-t-0 first:pt-0 cursor-pointer hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
                  >
                    <Badge tone="amber">{question.status}</Badge>
                    <p className="mt-1.5 text-sm leading-relaxed">{question.prompt}</p>
                  </Link>
                ))
              ) : (
                <EmptyState title="Geen vragen" body="Vraag-notities maken aparte vraagrecords aan." />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Draden</h2>
            </div>
            <div className="grid gap-1">
              {cabinet.threads.length ? (
                cabinet.threads.map((thread) => (
                  <Link
                    key={thread.id}
                    href={`/threads/${thread.slug}`}
                    className="block rounded-md px-2 py-2 text-sm transition-colors cursor-pointer hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    {thread.title}
                  </Link>
                ))
              ) : (
                <EmptyState title="Geen draden" body="Draden verschijnen wanneer notities tot reeksen worden samengesteld." />
              )}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Bronnen</h2>
            </div>
            <Link
              href="/sources"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
            >
              {cabinet.sourceCount} totaal →
            </Link>
          </div>
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
            <EmptyState title="Geen bronnen" body="Bronnen verschijnen hier zodra ze zijn aangemaakt." />
          )}
        </section>

        <section className="grid gap-3">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-base font-semibold text-foreground">Gearchiveerde notities</h2>
          </div>
          {cabinet.archivedEntries.length ? (
            <EntryList entries={cabinet.archivedEntries} />
          ) : (
            <EmptyState title="Geen gearchiveerde notities" body="Gearchiveerde notities verschijnen hier nadat hun status is gewijzigd." />
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
