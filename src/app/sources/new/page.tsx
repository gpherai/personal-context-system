import { isRecoverableReadError } from "@/application/errors";
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
        <header className="border-b border-border pb-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Sources</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">New source</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Add a new knowledge source to the Sanatana knowledge base.
          </p>
        </header>
        <section className="mt-6 border border-border bg-surface p-5">
          <SourceForm action={createSourceAction} themes={themes} />
        </section>
      </div>
    );
  } catch (error) {
    if (isRecoverableReadError(error)) {
      return (
        <div className="mx-auto max-w-4xl">
          <SetupNotice />
        </div>
      );
    }

    throw error;
  }
}
