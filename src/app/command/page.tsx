import Link from "next/link";
import { Bot, FolderTree, ShieldCheck, Terminal } from "lucide-react";

import { isRecoverableReadError } from "@/application/errors";
import { getSavedFilters } from "@/application/query-service";
import { getContextMirrorStatus } from "@/infrastructure/files/context-mirror-writer";
import { formatDateTime } from "@/lib/format";
import { savedFilterHref } from "@/lib/saved-filter-url";

import { RebuildMirrorForm } from "./rebuild-form";

export const dynamic = "force-dynamic";

export default async function CommandPage() {
  const mirrorStatus = await getContextMirrorStatus();
  const savedFilters = await getSavedFilters().catch((error: unknown) => {
    if (isRecoverableReadError(error)) {
      return [];
    }

    throw error;
  });

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <header className="border-b border-border pb-5">
        <p className="text-sm font-medium text-primary">Command Center</p>
        <h1 className="mt-1 text-3xl font-semibold">AI context operations</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Generate local AI-readable projections from the canonical database.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Context mirror</h2>
          </div>
          <p className="mb-4 text-sm leading-6 text-muted-foreground">
            Output path: <code className="rounded bg-surface-muted px-1 py-0.5">data/context-mirror</code>
          </p>
          <RebuildMirrorForm />
        </div>

        <aside className="grid gap-4">
          <div className="border border-border bg-surface p-4">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Write policy</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              AI reads generated projections first. Future writes must use validated commands.
            </p>
          </div>
          <div className="border border-border bg-surface p-4">
            <div className="mb-2 flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Future adapters</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">CLI and MCP should wrap the same services as this UI.</p>
          </div>
        </aside>
      </section>

      <section className="border border-border bg-surface p-5">
        <div className="mb-3 flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Equivalent terminal command</h2>
        </div>
        <code className="block overflow-x-auto bg-surface-muted px-3 py-2 text-sm">npm run mirror:build</code>
      </section>

      <section className="grid gap-4 md:grid-cols-[320px_1fr]">
        <div className="border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Mirror status</h2>
          <dl className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <div>
              <dt className="font-medium text-foreground">State</dt>
              <dd>{mirrorStatus.exists ? "Generated" : "Not generated"}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Output path</dt>
              <dd className="break-all">{mirrorStatus.outputDir}</dd>
            </div>
            {mirrorStatus.exists && (
              <>
                <div>
                  <dt className="font-medium text-foreground">Generated at</dt>
                  <dd>{mirrorStatus.generatedAt ?? "Unknown"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Manifest updated</dt>
                  <dd>{formatDateTime(mirrorStatus.manifestUpdatedAt)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Files</dt>
                  <dd>{mirrorStatus.files.length}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <div className="border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Generated files</h2>
          {mirrorStatus.files.length ? (
            <div className="mt-3 grid max-h-96 gap-1 overflow-auto text-sm">
              {mirrorStatus.files.slice(0, 80).map((file) => (
                <code key={file} className="rounded bg-surface-muted px-2 py-1 text-xs">
                  {file}
                </code>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No generated files found.</p>
          )}
        </div>
      </section>

      <section className="border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">Saved context filters</h2>
        {savedFilters.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
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
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No saved filters yet. Save one from the Ledger.</p>
        )}
      </section>
    </div>
  );
}
