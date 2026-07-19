import { Inbox } from "lucide-react";

import { Panel } from "@/components/ui";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Panel as="div" tone="dashed" pad="none" className="px-6 py-10 text-center">
      <Inbox className="mx-auto h-8 w-8 text-muted" aria-hidden="true" />
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
    </Panel>
  );
}
