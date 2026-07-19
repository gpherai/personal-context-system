import Link from "next/link";

import { Panel } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md">
      <Panel pad="lg">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">404</p>
        <h1 className="mt-2 font-serif text-xl font-semibold text-foreground">Not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The requested context record does not exist.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex cursor-pointer items-center rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Back to dashboard
        </Link>
      </Panel>
    </div>
  );
}
