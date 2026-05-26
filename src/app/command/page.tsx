import Link from "next/link";
import { Bot, FileText, FolderTree, ShieldCheck, Terminal } from "lucide-react";

import { isRecoverableReadError } from "@/application/errors";
import { getContextMirrorStatus, getSavedFilters } from "@/application/query-service";
import { formatDateTime } from "@/lib/format";
import { savedFilterHref, systemSavedFilters } from "@/lib/saved-filter-url";

import { RebuildMirrorForm } from "./rebuild-form";

export const dynamic = "force-dynamic";

export default async function CommandPage() {
  const [mirrorStatus, savedFilters] = await Promise.all([
    getContextMirrorStatus(),
    getSavedFilters().catch((error: unknown) => {
      if (isRecoverableReadError(error)) return [];
      throw error;
    }),
  ]);
  const projectBundleCount = mirrorStatus.files.filter((f) => f.startsWith("bundles/projects/")).length;
  const questionBundleCount = mirrorStatus.files.filter((f) => f.startsWith("bundles/questions/")).length;

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <header className="border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Command Center</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">AI context operations</h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Generate local AI-readable projections from the canonical database.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-[1fr_300px]">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Context mirror</h2>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Output path:{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
              data/context-mirror
            </code>
          </p>
          <RebuildMirrorForm />
        </div>

        <aside className="grid gap-4 content-start">
          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Write policy</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              AI reads generated projections first. Future writes must use validated commands.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Future adapters</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              CLI and MCP wrap the same services as this UI.
            </p>
          </div>
        </aside>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Terminal command</h2>
        </div>
        <code className="block overflow-x-auto rounded-md bg-surface-muted px-3 py-2 font-mono text-sm">
          npm run mirror:build
        </code>
      </section>

      <section className="grid gap-4 md:grid-cols-[300px_1fr]">
        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Mirror status</h2>
          <dl className="mt-3 grid gap-2.5 text-sm">
            <div>
              <dt className="font-medium text-foreground">State</dt>
              <dd className="mt-0.5 text-muted-foreground">
                {mirrorStatus.exists ? "Generated" : "Not generated"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Output path</dt>
              <dd className="mt-0.5 break-all font-mono text-xs text-muted-foreground">
                {mirrorStatus.outputDir}
              </dd>
            </div>
            {mirrorStatus.exists && (
              <>
                <div>
                  <dt className="font-medium text-foreground">Generated at</dt>
                  <dd className="mt-0.5 text-muted-foreground">{mirrorStatus.generatedAt ?? "Unknown"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Manifest updated</dt>
                  <dd className="mt-0.5 text-muted-foreground">{formatDateTime(mirrorStatus.manifestUpdatedAt)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Files</dt>
                  <dd className="mt-0.5 text-muted-foreground">{mirrorStatus.files.length}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Generated files</h2>
          {mirrorStatus.files.length ? (
            <div className="mt-3 grid max-h-96 gap-1 overflow-auto">
              {mirrorStatus.files.slice(0, 80).map((file) => (
                <code key={file} className="rounded bg-surface-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                  {file}
                </code>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No generated files found.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Context bundle variants</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { title: "Local full",     path: "bundles/local-full.md",      desc: "All local entries and the question queue." },
            { title: "Shareable only", path: "bundles/shareable-only.md",  desc: "Only entries marked shareable." },
            { title: "Project scoped", path: "bundles/projects/*.md",
              desc: mirrorStatus.exists ? `${projectBundleCount} generated project bundles.` : "Generated per project." },
            { title: "Question scoped",path: "bundles/questions/*.md",
              desc: mirrorStatus.exists ? `${questionBundleCount} generated question bundles.` : "Generated per tracked question." },
          ].map(({ title, path, desc }) => (
            <div key={path} className="grid gap-1.5">
              <p className="text-sm font-medium">{title}</p>
              <code className="block break-all rounded-md bg-surface-muted px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
                {path}
              </code>
              <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Context filters</h2>
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
      </section>
    </div>
  );
}
