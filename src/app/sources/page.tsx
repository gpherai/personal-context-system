import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { isDatabaseUnavailable } from "@/application/errors";
import { getSources, listThemes } from "@/application/query-service";
import { EmptyState } from "@/components/empty-state";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { sourceTypes } from "@/domain/context";
import { sourceTypeDetails } from "@/domain/taxonomy";
import type { SourceSummary } from "@/repositories/context-repository";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function param(raw: SearchParams, key: string): string {
  const v = raw[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function toStringRecord(raw: SearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) { if (value[0]) result[key] = value[0]; }
    else if (value) result[key] = value;
  }
  return result;
}

function SourceCard({ source }: { source: SourceSummary }) {
  return (
    <Link
      href={`/sources/${source.id}`}
      className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4 transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium leading-5">{source.title}</span>
        <Badge tone="neutral">{sourceTypeDetails[source.type].label}</Badge>
      </div>
      {source.description && (
        <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{source.description}</p>
      )}
      {source.themes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {source.themes.map((theme) => (
            <span key={theme.id} className="inline-flex h-5 items-center rounded px-2 text-xs bg-surface-muted text-muted-foreground">
              {theme.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export default async function SourcesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const rawSearchParams = await searchParams;
  const urlParams = toStringRecord(rawSearchParams);

  try {
    const [{ items: sources, total, page, pageSize }, themes] = await Promise.all([
      getSources(urlParams),
      listThemes()
    ]);

    const activeType = param(rawSearchParams, "type");
    const activeTheme = param(rawSearchParams, "themeSlug");
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    function pageHref(targetPage: number): string {
      const next = new URLSearchParams(urlParams);
      if (targetPage <= 1) {
        next.delete("page");
      } else {
        next.set("page", String(targetPage));
      }
      const qs = next.toString();
      return qs ? `/sources?${qs}` : "/sources";
    }

    return (
      <div className="mx-auto grid max-w-6xl gap-5">
        <header className="border-b border-border pb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Sources</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Sanatana knowledge sources</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Videos, books, posts, sadhanas, and other sources from the Sanatana knowledge base.
          </p>
        </header>

        <div className="flex items-center justify-between gap-4">
          <form
            aria-label="Filter sources"
            className="flex flex-wrap items-end gap-3"
          >
            <label className="grid gap-1.5 text-xs font-medium">
              Search
              <span className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input
                  className="field-input w-48 pl-9"
                  defaultValue={urlParams["search"] ?? ""}
                  name="search"
                  placeholder="title, metadata…"
                />
              </span>
            </label>

            <label className="grid gap-1.5 text-xs font-medium">
              Type
              <select
                className="field-select"
                defaultValue={activeType}
                name="type"
              >
                <option value="">All types</option>
                {sourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {sourceTypeDetails[type].label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-xs font-medium">
              Theme
              <select
                className="field-select"
                defaultValue={activeTheme}
                name="themeSlug"
              >
                <option value="">All themes</option>
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.slug}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              <Button type="submit">Filter</Button>
              <ButtonLink href="/sources" variant="secondary">Reset</ButtonLink>
            </div>
          </form>

          <Link
            href="/sources/new"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-sm transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New source
          </Link>
        </div>

        {sources.length > 0 ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sources.map((source) => (
                <SourceCard key={source.id} source={source} />
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
              <p>
                {total === 0
                  ? "No sources"
                  : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} sources`}
              </p>
              <div className="flex items-center gap-2">
                <ButtonLink
                  href={pageHref(page - 1)}
                  variant="secondary"
                  size="sm"
                  aria-disabled={page <= 1}
                  className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
                >
                  Previous
                </ButtonLink>
                <span className="tabular-nums">
                  Page {page} of {totalPages}
                </span>
                <ButtonLink
                  href={pageHref(page + 1)}
                  variant="secondary"
                  size="sm"
                  aria-disabled={page >= totalPages}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
                >
                  Next
                </ButtonLink>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-8">
            <EmptyState
              title="No sources found"
              body="Adjust the filters or add a new source."
            />
          </div>
        )}
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
