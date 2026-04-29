export default function SettingsPage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6">
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
    </div>
  );
}
