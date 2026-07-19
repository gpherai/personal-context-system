import Link from "next/link";
import { Bot, FileText, FolderTree, Package, ShieldCheck, Terminal } from "lucide-react";

import { isDatabaseUnavailable } from "@/application/errors";
import { getContextMirrorStatus, getSavedFilters } from "@/application/query-service";
import { PageHeader, Panel, PanelTitle } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { savedFilterHref, systemSavedFilters } from "@/lib/saved-filter-url";

import { GenerateBundleForm } from "./generate-bundle-form";
import { RebuildMirrorForm } from "./rebuild-form";

export const dynamic = "force-dynamic";

export default async function CommandPage() {
  const [mirrorStatus, savedFilters] = await Promise.all([
    getContextMirrorStatus(),
    getSavedFilters().catch((error: unknown) => {
      if (isDatabaseUnavailable(error)) return [];
      throw error;
    }),
  ]);
  const projectBundleCount = mirrorStatus.files.filter((f) => f.startsWith("bundles/projects/")).length;
  const questionBundleCount = mirrorStatus.files.filter((f) => f.startsWith("bundles/questions/")).length;

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader
        eyebrow="Command Center"
        title="AI context operations"
        description="Generate local AI-readable projections from the canonical database."
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Panel>
          <PanelTitle icon={<FolderTree className="h-4 w-4 text-primary" aria-hidden="true" />}>
            Context mirror
          </PanelTitle>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Output path:{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
              data/context-mirror
            </code>
          </p>
          <RebuildMirrorForm />

          <div className="mt-5 border-t border-border pt-5">
            <PanelTitle icon={<Package className="h-4 w-4 text-primary" aria-hidden="true" />}>
              Verifiable bundle
            </PanelTitle>
            <GenerateBundleForm />
          </div>
        </Panel>

        <aside className="grid content-start gap-4">
          <Panel pad="sm">
            <PanelTitle icon={<ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />}>
              Write policy
            </PanelTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              AI reads generated projections first. Future writes must use validated commands.
            </p>
          </Panel>
          <Panel pad="sm">
            <PanelTitle icon={<Bot className="h-4 w-4 text-primary" aria-hidden="true" />}>
              Future adapters
            </PanelTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              CLI and MCP wrap the same services as this UI.
            </p>
          </Panel>
        </aside>
      </section>

      <Panel>
        <PanelTitle icon={<Terminal className="h-4 w-4 text-primary" aria-hidden="true" />}>
          Terminal command
        </PanelTitle>
        <code className="block overflow-x-auto rounded-md bg-surface-muted px-3 py-2 font-mono text-sm">
          npm run mirror:build
        </code>
      </Panel>

      <section className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Panel>
          <PanelTitle>Mirror status</PanelTitle>
          <dl className="grid gap-2.5 text-sm">
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
                  <dd className="mt-0.5 font-mono text-muted-foreground">{mirrorStatus.files.length}</dd>
                </div>
              </>
            )}
          </dl>
        </Panel>

        <Panel>
          <PanelTitle>Generated files</PanelTitle>
          {mirrorStatus.files.length ? (
            <div className="grid max-h-96 gap-1 overflow-auto">
              {mirrorStatus.files.slice(0, 80).map((file) => (
                <code key={file} className="rounded bg-surface-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                  {file}
                </code>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No generated files found.</p>
          )}
        </Panel>
      </section>

      <Panel>
        <PanelTitle icon={<FileText className="h-4 w-4 text-primary" aria-hidden="true" />}>
          Context bundle variants
        </PanelTitle>
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
      </Panel>

      <Panel>
        <PanelTitle>Context filters</PanelTitle>
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {systemSavedFilters.map((filter) => (
              <Link
                key={filter.name}
                href={savedFilterHref(filter.params)}
                className="inline-flex h-9 cursor-pointer items-center rounded-full border border-border bg-surface px-3.5 text-xs font-medium transition-colors duration-150 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-8"
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
                  className="inline-flex h-9 cursor-pointer items-center rounded-full border border-primary/25 bg-primary/8 px-3.5 text-xs font-medium text-primary transition-colors duration-150 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:h-8"
                >
                  {filter.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
