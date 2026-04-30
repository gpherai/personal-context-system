export default function SettingsPage() {
  const mirrorDir = process.env.CONTEXT_MIRROR_DIR ?? "data/context-mirror";

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <header className="border-b border-border pb-5">
        <p className="text-sm font-medium text-primary">Settings</p>
        <h1 className="mt-1 text-3xl font-semibold">Local operation</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Configuration stays local. Secrets and generated/private data are ignored by git.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Database</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            PostgreSQL runs through Docker Compose by default.
          </p>
          <code className="mt-3 block overflow-x-auto bg-surface-muted px-3 py-2 text-sm">docker compose up -d db</code>
        </div>
        <div className="border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Environment</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Copy `.env.example` to `.env` and keep `.env` out of source control.
          </p>
          <code className="mt-3 block overflow-x-auto bg-surface-muted px-3 py-2 text-sm">cp .env.example .env</code>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Context mirror</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Generated AI-readable projections are local-only and can be rebuilt from PostgreSQL.
          </p>
          <dl className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <div>
              <dt className="font-medium text-foreground">Path</dt>
              <dd className="break-all">{mirrorDir}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Git policy</dt>
              <dd>Ignored, generated, never edited by hand.</dd>
            </div>
          </dl>
        </div>

        <div className="border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold">Backup surfaces</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Back up canonical and private local data before relying on the app daily.
          </p>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <li>PostgreSQL dump</li>
            <li>
              <code className="rounded bg-surface-muted px-1 py-0.5">data/attachments</code>
            </li>
            <li>
              <code className="rounded bg-surface-muted px-1 py-0.5">.env</code> stored outside git
            </li>
            <li>Committed schema and migrations</li>
          </ul>
        </div>
      </section>

      <section className="border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">Privacy defaults</h2>
        <div className="mt-3 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <div className="border border-border p-3">
            <p className="font-medium text-foreground">private</p>
            <p className="mt-1 leading-6">Default local records. Included in the local mirror.</p>
          </div>
          <div className="border border-border p-3">
            <p className="font-medium text-foreground">sensitive</p>
            <p className="mt-1 leading-6">Marked clearly. Exclude or redact for shareable exports.</p>
          </div>
          <div className="border border-border p-3">
            <p className="font-medium text-foreground">shareable</p>
            <p className="mt-1 leading-6">Candidate records for future stricter export bundles.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
