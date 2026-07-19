import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { getSourceById, listThemes } from "@/application/query-service";
import { SetupNotice } from "@/components/setup-notice";
import { isValidId } from "@/lib/format";
import { SourceForm } from "@/components/source-form";
import { PageHeader, Panel } from "@/components/ui";

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
      <div className="mx-auto grid max-w-4xl gap-6">
        <PageHeader eyebrow="Sources" title="Edit source" description={source.title} />
        <Panel>
          <SourceForm action={boundAction} themes={themes} initial={source} isEdit />
        </Panel>
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
