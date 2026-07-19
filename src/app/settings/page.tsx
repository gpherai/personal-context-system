import { ThemeSwitcher } from "@/components/theme-switcher";
import { PageHeader, Panel } from "@/components/ui";
import { themes } from "@/lib/themes";

export default function SettingsPage() {
  const mirrorDir = process.env.CONTEXT_MIRROR_DIR ?? "data/context-mirror";

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader
        eyebrow="Settings"
        title="Local operation"
        description="Configuration stays local. Secrets and generated/private data are ignored by git."
      />

      <section className="grid gap-4">
        <h2 className="text-base font-semibold">Appearance</h2>
        <Panel pad="none">
          <div className="p-5">
            <p className="text-sm font-medium">Theme &amp; mode</p>
            {/* Read from the theme registry so this copy cannot drift from the
                themes that actually exist. */}
            <dl className="mt-2 grid gap-1.5 text-sm">
              {themes.map((theme) => (
                <div key={theme.name} className="flex flex-wrap gap-x-2">
                  <dt className="font-medium">{theme.label}</dt>
                  <dd className="text-muted-foreground">{theme.description}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-sm text-muted-foreground">Each supports light and dark mode.</p>
          </div>
          <div className="border-t border-border">
            <ThemeSwitcher />
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Panel>
          <h2 className="text-sm font-semibold">Database</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            PostgreSQL runs through Docker Compose by default.
          </p>
          <code className="mt-3 block overflow-x-auto rounded-md bg-surface-muted px-3 py-2 font-mono text-sm">
            docker compose up -d db
          </code>
        </Panel>
        <Panel>
          <h2 className="text-sm font-semibold">Environment</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Copy <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-xs">.env.example</code> to{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-xs">.env</code> and keep it out of
            source control.
          </p>
          <code className="mt-3 block overflow-x-auto rounded-md bg-surface-muted px-3 py-2 font-mono text-sm">
            cp .env.example .env
          </code>
        </Panel>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Panel>
          <h2 className="text-sm font-semibold">Context mirror</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Generated AI-readable projections are local-only and rebuilt from PostgreSQL.
          </p>
          <dl className="mt-4 grid gap-2.5 text-sm">
            <div>
              <dt className="font-medium text-foreground">Path</dt>
              <dd className="mt-0.5 break-all font-mono text-xs text-muted-foreground">{mirrorDir}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Git policy</dt>
              <dd className="mt-0.5 text-muted-foreground">Ignored, generated, never edited by hand.</dd>
            </div>
          </dl>
        </Panel>

        <Panel>
          <h2 className="text-sm font-semibold">Backup surfaces</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Back up canonical and private local data before relying on the app daily.
          </p>
          <ul className="mt-4 grid gap-1.5 text-sm text-muted-foreground">
            <li>PostgreSQL dump</li>
            <li>
              <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-xs">data/attachments</code>
            </li>
            <li>
              <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-xs">.env</code> stored outside git
            </li>
            <li>Committed schema and migrations</li>
          </ul>
        </Panel>
      </section>

      <Panel>
        <h2 className="text-sm font-semibold">Privacy defaults</h2>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          {[
            { level: "private",    desc: "Default local records. Included in the local mirror."       },
            { level: "sensitive",  desc: "Marked clearly. Exclude or redact for shareable exports."   },
            { level: "shareable",  desc: "Candidate records for future stricter export bundles."       },
          ].map(({ level, desc }) => (
            <Panel key={level} as="div" tone="outline" pad="none" className="p-3.5">
              <p className="font-semibold text-foreground">{level}</p>
              <p className="mt-1 leading-relaxed text-muted-foreground">{desc}</p>
            </Panel>
          ))}
        </div>
      </Panel>
    </div>
  );
}
