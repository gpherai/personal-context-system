import Link from "next/link";
import { Search } from "lucide-react";

import { Button, ButtonLink, PageHeader, Panel, PanelTitle } from "@/components/ui";

import { isDatabaseUnavailable } from "@/application/errors";
import { getLedgerDropdowns, getLedgerEntries, getSavedFilters } from "@/application/query-service";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import type { SavedFilterParams } from "@/domain/context";
import { entryStatuses, entryTypes, privacyLevels, savedFilterParamsSchema } from "@/domain/context";
import { labelize } from "@/lib/format";
import { savedFilterHref, systemSavedFilters } from "@/lib/saved-filter-url";

import { SaveFilterForm } from "./save-filter-form";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function toStringRecord(raw: SearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) { if (value[0]) result[key] = value[0]; }
    else if (value) result[key] = value;
  }
  return result;
}

function toSavedFilterParams(params: Record<string, string>): SavedFilterParams {
  const filterParams = {
    search:       params["search"]       || undefined,
    type:         params["type"]         || undefined,
    status:       params["status"]       || undefined,
    privacyLevel: params["privacyLevel"] || undefined,
    themeSlug:    params["themeSlug"]    || undefined,
    projectSlug:  params["projectSlug"]  || undefined,
    questionId:   params["questionId"]   || undefined,
    occurredFrom: params["occurredFrom"] || undefined,
    occurredTo:   params["occurredTo"]   || undefined,
  };
  const parsed = savedFilterParamsSchema.safeParse(
    Object.fromEntries(Object.entries(filterParams).filter(([, v]) => v !== undefined))
  );
  return parsed.success ? parsed.data : {};
}

export default async function LedgerPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const rawSearchParams = await searchParams;
  const params = toStringRecord(rawSearchParams);

  try {
    const [entries, overview, savedFilters] = await Promise.all([
      getLedgerEntries(params),
      getLedgerDropdowns(),
      getSavedFilters(),
    ]);
    const currentFilterParams = toSavedFilterParams(params);
    const hasCurrentFilter = Object.keys(currentFilterParams).length > 0;

    return (
      <div className="mx-auto grid max-w-6xl gap-6">
        <PageHeader
          eyebrow="Ledger"
          title="Thinking ledger"
          description="Chronological stream with structured filters."
        />

        <section className={hasCurrentFilter ? "grid gap-4 lg:grid-cols-[1fr_340px]" : "grid gap-4"}>
          <Panel pad="sm">
            <PanelTitle>Context filters</PanelTitle>
            <div className="grid gap-3">
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
          </Panel>
          {hasCurrentFilter ? <SaveFilterForm params={currentFilterParams} /> : null}
        </section>

        <Panel
          as="form"
          pad="sm"
          action="/ledger"
          aria-label="Filter entries"
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_160px_140px_140px_160px_160px]"
        >
          <label className="grid gap-1.5 text-sm font-medium">
            Search
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                className="field-input pl-9"
                defaultValue={params["search"] ?? ""}
                name="search"
                placeholder="title, body, summary"
              />
            </span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Type
            <select className="field-select" defaultValue={params["type"] ?? ""} name="type">
              <option value="">All</option>
              {entryTypes.map((t) => (
                <option key={t} value={t}>{labelize(t)}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Status
            <select className="field-select" defaultValue={params["status"] ?? ""} name="status">
              <option value="">All</option>
              {entryStatuses.map((s) => (
                <option key={s} value={s}>{labelize(s)}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Privacy
            <select className="field-select" defaultValue={params["privacyLevel"] ?? ""} name="privacyLevel">
              <option value="">All</option>
              {privacyLevels.map((p) => (
                <option key={p} value={p}>{labelize(p)}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Theme
            <select className="field-select" defaultValue={params["themeSlug"] ?? ""} name="themeSlug">
              <option value="">All</option>
              {overview.activeThemes.map((t) => (
                <option key={t.id} value={t.slug}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Project
            <select className="field-select" defaultValue={params["projectSlug"] ?? ""} name="projectSlug">
              <option value="">All</option>
              {overview.activeProjects.map((p) => (
                <option key={p.id} value={p.slug}>{p.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Question
            <select className="field-select" defaultValue={params["questionId"] ?? ""} name="questionId">
              <option value="">All</option>
              {overview.openQuestions.map((q) => (
                <option key={q.id} value={q.id}>{q.prompt}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            From
            <input className="field-input" defaultValue={params["occurredFrom"] ?? ""} name="occurredFrom" type="date" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            To
            <input className="field-input" defaultValue={params["occurredTo"] ?? ""} name="occurredTo" type="date" />
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit">Apply</Button>
            <ButtonLink href="/ledger" variant="secondary">Clear</ButtonLink>
          </div>
        </Panel>

        <EntryList entries={entries} />
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
