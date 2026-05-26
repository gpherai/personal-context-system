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
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value) params.set(key, value);
  }
  return params;
}

function toSavedFilterParams(params: URLSearchParams): SavedFilterParams {
  const filterParams = {
    search:       params.get("search")       || undefined,
    type:         params.get("type")         || undefined,
    status:       params.get("status")       || undefined,
    privacyLevel: params.get("privacyLevel") || undefined,
    themeSlug:    params.get("themeSlug")    || undefined,
    projectSlug:  params.get("projectSlug")  || undefined,
    questionId:   params.get("questionId")   || undefined,
    occurredFrom: params.get("occurredFrom") || undefined,
    occurredTo:   params.get("occurredTo")   || undefined,
  };
  const parsed = savedFilterParamsSchema.safeParse(
    Object.fromEntries(Object.entries(filterParams).filter(([, v]) => v !== undefined))
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
      getSavedFilters(),
    ]);
    const currentFilterParams = toSavedFilterParams(params);
    const hasCurrentFilter = Object.keys(currentFilterParams).length > 0;

    return (
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Ledger</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Thinking ledger</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Chronological stream with structured filters.
          </p>
        </header>

        <section className={hasCurrentFilter ? "grid gap-4 lg:grid-cols-[1fr_340px]" : "grid gap-4"}>
          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Context filters
            </h2>
            <div className="mt-3 grid gap-3">
              <div className="flex flex-wrap gap-2">
                {systemSavedFilters.map((filter) => (
                  <Link
                    key={filter.name}
                    href={savedFilterHref(filter.params)}
                    className="inline-flex h-8 items-center rounded-full border border-border bg-surface px-3.5 text-xs font-medium transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
                      className="inline-flex h-8 items-center rounded-full border border-primary/25 bg-primary/8 px-3.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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

        <form
          aria-label="Filter entries"
          className="grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1fr_160px_140px_140px_160px_160px]"
        >
          <label className="grid gap-1.5 text-sm font-medium">
            Search
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                className="field-input pl-9"
                defaultValue={params.get("search") ?? ""}
                name="search"
                placeholder="title, body, summary"
              />
            </span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Type
            <select className="field-select" defaultValue={params.get("type") ?? ""} name="type">
              <option value="">Any</option>
              {entryTypes.map((t) => (
                <option key={t} value={t}>{labelize(t)}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Status
            <select className="field-select" defaultValue={params.get("status") ?? ""} name="status">
              <option value="">Any</option>
              {entryStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Privacy
            <select className="field-select" defaultValue={params.get("privacyLevel") ?? ""} name="privacyLevel">
              <option value="">Any</option>
              {privacyLevels.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Theme
            <select className="field-select" defaultValue={params.get("themeSlug") ?? ""} name="themeSlug">
              <option value="">Any</option>
              {overview.activeThemes.map((t) => (
                <option key={t.id} value={t.slug}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Project
            <select className="field-select" defaultValue={params.get("projectSlug") ?? ""} name="projectSlug">
              <option value="">Any</option>
              {overview.activeProjects.map((p) => (
                <option key={p.id} value={p.slug}>{p.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Question
            <select className="field-select" defaultValue={params.get("questionId") ?? ""} name="questionId">
              <option value="">Any</option>
              {overview.openQuestions.map((q) => (
                <option key={q.id} value={q.id}>{q.prompt}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            From
            <input className="field-input" defaultValue={params.get("occurredFrom") ?? ""} name="occurredFrom" type="date" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            To
            <input className="field-input" defaultValue={params.get("occurredTo") ?? ""} name="occurredTo" type="date" />
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit">Apply</Button>
            <Link
              href="/ledger"
              className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
        <div className="mx-auto max-w-xl">
          <SetupNotice />
        </div>
      );
    }
    throw error;
  }
}
