import { Database, Terminal } from "lucide-react";

export function SetupNotice() {
  return (
    <section className="border-l-4 border-amber-400 bg-amber-50 px-5 py-4 text-amber-950">
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold">Local database setup needed</h2>
          <p className="mt-1 text-sm leading-6">
            Start PostgreSQL and run Prisma migrations before using the app.
          </p>
          <div className="mt-3 grid gap-2 font-mono text-xs">
            <span className="inline-flex items-center gap-2">
              <Terminal className="h-4 w-4" aria-hidden="true" />
              docker compose up -d db
            </span>
            <span>npm run db:generate</span>
            <span>npm run db:migrate</span>
          </div>
        </div>
      </div>
    </section>
  );
}
