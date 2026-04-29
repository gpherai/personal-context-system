import { Search } from "lucide-react";

import { isRecoverableReadError } from "@/application/errors";
import { getLedgerEntries } from "@/application/query-service";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { entryStatuses, entryTypes, privacyLevels } from "@/domain/context";
import { labelize } from "@/lib/format";

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

export default async function LedgerPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const rawSearchParams = await searchParams;
  const params = toUrlSearchParams(rawSearchParams);

  try {
    const entries = await getLedgerEntries(params);

    return (
      <div className="mx-auto grid max-w-6xl gap-5">
        <header className="border-b border-border pb-5">
          <p className="text-sm font-medium text-primary">Ledger</p>
          <h1 className="mt-1 text-3xl font-semibold">Thinking ledger</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Chronological stream with structured filters.
          </p>
        </header>

        <form className="grid gap-3 border border-border bg-surface p-4 md:grid-cols-[1fr_180px_160px_160px_auto]">
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
          <button className="h-10 self-end rounded-md border border-primary bg-primary px-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">
            Apply
          </button>
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
