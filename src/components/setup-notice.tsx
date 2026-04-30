import { Database } from "lucide-react";

export function SetupNotice() {
  return (
    <section className="border-l-4 border-caution/50 bg-caution/8 px-5 py-4 text-caution">
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-semibold">Local database setup needed</h2>
          <p className="mt-1 text-sm leading-6">
            Start PostgreSQL and run Prisma migrations before using the app.
          </p>
          <div className="mt-3 grid gap-2 font-mono text-xs">
            <code>docker compose up -d db</code>
            <code>npm run db:generate</code>
            <code>npm run db:migrate</code>
          </div>
        </div>
      </div>
    </section>
  );
}
