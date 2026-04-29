import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl border border-border bg-surface p-6">
      <h1 className="text-xl font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">The requested context record does not exist.</p>
      <Link className="mt-4 inline-block text-sm font-medium text-primary hover:underline" href="/">
        Back to dashboard
      </Link>
    </div>
  );
}
