import { Alert } from "@/components/ui";

export function SetupNotice() {
  return (
    <Alert tone="caution" title="Local database setup needed">
      <p className="text-foreground">Start PostgreSQL and run Prisma migrations before using the app.</p>
      <div className="mt-3 grid gap-2 font-mono text-xs text-foreground">
        <code>docker compose up -d db</code>
        <code>npm run db:generate</code>
        <code>npm run db:migrate</code>
      </div>
    </Alert>
  );
}
