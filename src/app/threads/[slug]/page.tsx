import { Badge } from "@/components/ui/badge";

export default async function ThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <div className="mx-auto max-w-3xl border border-border bg-surface p-6">
      <Badge>Thread</Badge>
      <h1 className="mt-3 text-2xl font-semibold">{slug}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Curated thread editing is part of the model and route structure, but thread creation comes after capture,
        ledger, cabinet, and context mirror flows are stable.
      </p>
    </div>
  );
}
