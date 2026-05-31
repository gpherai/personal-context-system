import { isDatabaseUnavailable } from "@/application/errors";
import { getSourcesByType, listThemes } from "@/application/query-service";
import { SetupNotice } from "@/components/setup-notice";
import { SourceForm } from "@/components/source-form";

import { createSourceAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewSourcePage() {
  try {
    const [themes, deities, teachers, stotraSources] = await Promise.all([
      listThemes(),
      getSourcesByType("deity_concept"),
      getSourcesByType("teacher"),
      getSourcesByType("stotra")
    ]);

    return (
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-border pb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Sources</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">New source</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Add a new knowledge source to the Sanatana knowledge base.
          </p>
        </header>
        <section className="mt-6 border border-border bg-surface p-5">
          <SourceForm action={createSourceAction} themes={themes} deities={deities} teachers={teachers} stotraSources={stotraSources} />
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
