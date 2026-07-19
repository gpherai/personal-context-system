import { isDatabaseUnavailable } from "@/application/errors";
import { listThemes } from "@/application/query-service";
import { SetupNotice } from "@/components/setup-notice";
import { SourceForm } from "@/components/source-form";
import { PageHeader, Panel } from "@/components/ui";

import { createSourceAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewSourcePage() {
  try {
    const themes = await listThemes();

    return (
      <div className="mx-auto grid max-w-4xl gap-6">
        <PageHeader eyebrow="Sources" title="New source" description="Add a new source." />
        <Panel>
          <SourceForm action={createSourceAction} themes={themes} />
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
