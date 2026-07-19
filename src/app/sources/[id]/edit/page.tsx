import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { getSourceById, listThemes } from "@/application/query-service";
import { SetupNotice } from "@/components/setup-notice";
import { isValidId } from "@/lib/format";
import { SourceForm } from "@/components/source-form";

import { updateSourceAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isValidId(id)) notFound();

  try {
    const [source, themes] = await Promise.all([
      getSourceById(id),
      listThemes()
    ]);

    if (!source) {
      notFound();
    }

    const boundAction = updateSourceAction.bind(null, id);

    return (
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Sources</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Edit source</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{source.title}</p>
        </header>
        <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm">
          <SourceForm action={boundAction} themes={themes} initial={source} isEdit />
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
