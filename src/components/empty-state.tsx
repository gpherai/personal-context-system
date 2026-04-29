export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-border bg-surface px-5 py-8 text-center">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
