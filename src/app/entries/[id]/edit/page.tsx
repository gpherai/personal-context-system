import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { getEntryById } from "@/application/query-service";
import { SetupNotice } from "@/components/setup-notice";
import { isValidId } from "@/lib/format";
import { ButtonLink, PageHeader, Panel } from "@/components/ui";

import { EditEntryForm } from "./edit-entry-form";

export const dynamic = "force-dynamic";

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isValidId(id)) notFound();

  try {
    const entry = await getEntryById(id);

    if (!entry) {
      notFound();
    }

    return (
      <div className="mx-auto grid max-w-4xl gap-6">
        <PageHeader
          eyebrow="Edit entry"
          title={entry.title}
          actions={<ButtonLink href={`/entries/${entry.id}`}>Back to entry</ButtonLink>}
        />

        <Panel>
          <EditEntryForm entry={entry} />
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
