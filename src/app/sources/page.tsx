import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { isDatabaseUnavailable } from "@/application/errors";
import { getSources, listThemes } from "@/application/query-service";
import { EmptyState } from "@/components/empty-state";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { privacyLevels, recordStatuses, sourceSortOptions, sourceTypes } from "@/domain/context";
import { conversationProviderLabels, sourceTypeDetails } from "@/domain/taxonomy";
import { cn } from "@/lib/cn";
import { labelize } from "@/lib/format";
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

const sourceSortLabels: Record<(typeof sourceSortOptions)[number], string> = {
  title: "Title (A–Z)",
  createdAt: "Newest first",
  updatedAt: "Recently updated"
};

function privacyTone(privacy: SourceSummary["privacyLevel"]) {
  if (privacy === "sensitive") return "amber" as const;
  if (privacy === "shareable") return "teal" as const;
  return "neutral" as const;
}

function SourceCard({ source }: { source: SourceSummary }) {
  const provider = source.metadata.type === "conversation" ? source.metadata.provider : undefined;

  return (
    <Link
      href={`/sources/${source.id}`}
      className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4 transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium leading-5">{source.title}</span>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <Badge tone="neutral">{sourceTypeDetails[source.type].label}</Badge>
          {provider && <Badge tone="neutral">{conversationProviderLabels[provider]}</Badge>}
          <Badge tone={privacyTone(source.privacyLevel)}>{labelize(source.privacyLevel)}</Badge>
        </div>
      </div>
      {source.description && (
        <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{source.description}</p>
      )}
      {source.themes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {source.themes.map((theme) => (
            <Badge key={theme.id} tone="neutral">{theme.name}</Badge>
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
    const [{ items: sources, total, page, pageSize, searchCapped }, themes] = await Promise.all([
      getSources(urlParams),
      listThemes()
    ]);

    const activeType = param(rawSearchParams, "type");
    const activeTheme = param(rawSearchParams, "themeSlug");
    const activeStatus = param(rawSearchParams, "status");
    const activePrivacy = param(rawSearchParams, "privacyLevel");
    const activeProvider = param(rawSearchParams, "provider");
    const activeSort = param(rawSearchParams, "sort");
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
        <header className="border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Sources</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Source library</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            Videos, books, posts, and imported conversations.
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

            <label className="grid gap-1.5 text-xs font-medium">
              Status
              <select
                className="field-select"
                defaultValue={activeStatus}
                name="status"
              >
                <option value="">Active</option>
                {recordStatuses
                  .filter((status) => status !== "active")
                  .map((status) => (
                    <option key={status} value={status}>
                      {labelize(status)}
                    </option>
                  ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-xs font-medium">
              Privacy
              <select
                className="field-select"
                defaultValue={activePrivacy}
                name="privacyLevel"
              >
                <option value="">All privacy levels</option>
                {privacyLevels.map((level) => (
                  <option key={level} value={level}>
                    {labelize(level)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-xs font-medium">
              AI
              <select
                className="field-select"
                defaultValue={activeProvider}
                name="provider"
              >
                <option value="">All AIs</option>
                {Object.entries(conversationProviderLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-xs font-medium">
              Sort
              <select
                className="field-select"
                defaultValue={activeSort || "title"}
                name="sort"
              >
                {sourceSortOptions.map((option) => (
                  <option key={option} value={option}>
                    {sourceSortLabels[option]}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              <Button type="submit">Filter</Button>
              <ButtonLink href="/sources" variant="secondary">Reset</ButtonLink>
            </div>
          </form>

          <ButtonLink href="/sources/new" variant="primary" className="shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New source
          </ButtonLink>
        </div>

        {searchCapped && (
          <p className="text-xs text-muted-foreground">
            More than {total} results for this search — narrow your search term to see everything.
          </p>
        )}

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
                  aria-disabled={page <= 1}
                  className={cn("min-h-11", page <= 1 ? "pointer-events-none opacity-50" : undefined)}
                >
                  Previous
                </ButtonLink>
                <span className="tabular-nums">
                  Page {page} of {totalPages}
                </span>
                <ButtonLink
                  href={pageHref(page + 1)}
                  variant="secondary"
                  aria-disabled={page >= totalPages}
                  className={cn("min-h-11", page >= totalPages ? "pointer-events-none opacity-50" : undefined)}
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
