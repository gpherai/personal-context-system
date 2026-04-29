import { Bot, FolderTree, ShieldCheck, Terminal } from "lucide-react";

import { RebuildMirrorForm } from "./rebuild-form";

export const dynamic = "force-dynamic";

export default function CommandPage() {
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
    </div>
  );
}
