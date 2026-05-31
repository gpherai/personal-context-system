import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { getSourceById, getSourcesByType, listThemes } from "@/application/query-service";
import { SetupNotice } from "@/components/setup-notice";
import { isValidId } from "@/lib/format";
import { SourceForm } from "@/components/source-form";

import { updateSourceAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditSourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isValidId(id)) notFound();

  try {
    const [source, themes, deities, teachers, stotraSources] = await Promise.all([
      getSourceById(id),
      listThemes(),
      getSourcesByType("deity_concept"),
      getSourcesByType("teacher"),
      getSourcesByType("stotra")
    ]);

    if (!source) {
      notFound();
    }

    const boundAction = updateSourceAction.bind(null, id);

    return (
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-border pb-5">
          <p className="text-sm font-medium text-primary">Sources</p>
          <h1 className="mt-1 text-3xl font-semibold">Edit source</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{source.title}</p>
        </header>
        <section className="mt-6 border border-border bg-surface p-5">
          <SourceForm action={boundAction} themes={themes} deities={deities} teachers={teachers} stotraSources={stotraSources} initial={source} isEdit />
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
