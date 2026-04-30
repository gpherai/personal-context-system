import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

import { isRecoverableReadError } from "@/application/errors";
import { getDashboardOverview, getLedgerEntries, getSavedFilters } from "@/application/query-service";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import type { SavedFilterParams } from "@/domain/context";
import { entryStatuses, entryTypes, privacyLevels, savedFilterParamsSchema } from "@/domain/context";
import { labelize } from "@/lib/format";
import { savedFilterHref, systemSavedFilters } from "@/lib/saved-filter-url";

import { SaveFilterForm } from "./save-filter-form";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(raw: SearchParams): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value) {
      params.set(key, value);
    }
  }

  return params;
}

function toSavedFilterParams(params: URLSearchParams): SavedFilterParams {
  const filterParams = {
    search: params.get("search") || undefined,
    type: params.get("type") || undefined,
    status: params.get("status") || undefined,
    privacyLevel: params.get("privacyLevel") || undefined,
    themeSlug: params.get("themeSlug") || undefined,
    projectSlug: params.get("projectSlug") || undefined,
    questionId: params.get("questionId") || undefined,
    occurredFrom: params.get("occurredFrom") || undefined,
    occurredTo: params.get("occurredTo") || undefined
  };

  const parsed = savedFilterParamsSchema.safeParse(
    Object.fromEntries(Object.entries(filterParams).filter(([, value]) => value !== undefined))
  );

  return parsed.success ? parsed.data : {};
}

export default async function LedgerPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const rawSearchParams = await searchParams;
  const params = toUrlSearchParams(rawSearchParams);

  try {
    const [entries, overview, savedFilters] = await Promise.all([
      getLedgerEntries(params),
      getDashboardOverview(),
      getSavedFilters()
    ]);
    const currentFilterParams = toSavedFilterParams(params);
    const hasCurrentFilter = Object.keys(currentFilterParams).length > 0;

    return (
      <div className="mx-auto grid max-w-6xl gap-5">
        <header className="border-b border-border pb-5">
          <p className="text-sm font-medium text-primary">Ledger</p>
          <h1 className="mt-1 text-3xl font-semibold">Thinking ledger</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Chronological stream with structured filters.
          </p>
        </header>

        <section className={hasCurrentFilter ? "grid gap-4 lg:grid-cols-[1fr_340px]" : "grid gap-4"}>
          <div className="border border-border bg-surface p-4">
            <h2 className="text-sm font-semibold">Context filters</h2>
            <div className="mt-3 grid gap-3">
              <div className="flex flex-wrap gap-2">
                {systemSavedFilters.map((filter) => (
                  <Link
                    key={filter.name}
                    href={savedFilterHref(filter.params)}
                    className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                  >
                    {filter.name}
                  </Link>
                ))}
              </div>
              {savedFilters.length ? (
                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  {savedFilters.map((filter) => (
                    <Link
                      key={filter.id}
                      href={savedFilterHref(filter.params)}
                      className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                    >
                      {filter.name}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          {hasCurrentFilter ? <SaveFilterForm params={currentFilterParams} /> : null}
        </section>

        <form className="grid gap-3 border border-border bg-surface p-4 md:grid-cols-2 xl:grid-cols-[1fr_180px_160px_160px_180px_180px]">
          <label className="grid gap-2 text-sm font-medium">
            Search
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                className="h-10 w-full rounded-md border border-border bg-surface px-9 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                defaultValue={params.get("search") ?? ""}
                name="search"
                placeholder="title, body, summary"
              />
            </span>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Type
            <select
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              defaultValue={params.get("type") ?? ""}
              name="type"
            >
              <option value="">Any</option>
              {entryTypes.map((type) => (
                <option key={type} value={type}>
                  {labelize(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Status
            <select
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              defaultValue={params.get("status") ?? ""}
              name="status"
            >
              <option value="">Any</option>
              {entryStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Privacy
            <select
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              defaultValue={params.get("privacyLevel") ?? ""}
              name="privacyLevel"
            >
              <option value="">Any</option>
              {privacyLevels.map((privacy) => (
                <option key={privacy} value={privacy}>
                  {privacy}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Theme
            <select
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              defaultValue={params.get("themeSlug") ?? ""}
              name="themeSlug"
            >
              <option value="">Any</option>
              {overview.activeThemes.map((theme) => (
                <option key={theme.id} value={theme.slug}>
                  {theme.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Project
            <select
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              defaultValue={params.get("projectSlug") ?? ""}
              name="projectSlug"
            >
              <option value="">Any</option>
              {overview.activeProjects.map((project) => (
                <option key={project.id} value={project.slug}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Question
            <select
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              defaultValue={params.get("questionId") ?? ""}
              name="questionId"
            >
              <option value="">Any</option>
              {overview.openQuestions.map((question) => (
                <option key={question.id} value={question.id}>
                  {question.prompt}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            From
            <input
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              defaultValue={params.get("occurredFrom") ?? ""}
              name="occurredFrom"
              type="date"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            To
            <input
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              defaultValue={params.get("occurredTo") ?? ""}
              name="occurredTo"
              type="date"
            />
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit">Apply</Button>
            <Link
              href="/ledger"
              className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              Reset
            </Link>
          </div>
        </form>

        <EntryList entries={entries} />
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
