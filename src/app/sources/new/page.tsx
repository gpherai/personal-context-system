import { isDatabaseUnavailable } from "@/application/errors";
import { listThemes } from "@/application/query-service";
import { SetupNotice } from "@/components/setup-notice";
import { SourceForm } from "@/components/source-form";

import { createSourceAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewSourcePage() {
  try {
    const themes = await listThemes();

    return (
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Sources</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">New source</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            Add a new source.
          </p>
        </header>
        <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm">
          <SourceForm action={createSourceAction} themes={themes} />
        </section>
      </div>
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return (
        <div className="mx-auto max-w-4xl">
          <SetupNotice />
        </div>
      );
    }

    throw error;
  }
}
