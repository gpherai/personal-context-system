import Link from "next/link";
import { notFound } from "next/navigation";

import { isRecoverableReadError } from "@/application/errors";
import { getEntryById } from "@/application/query-service";
import { SetupNotice } from "@/components/setup-notice";

import { EditEntryForm } from "./edit-entry-form";

export const dynamic = "force-dynamic";

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const entry = await getEntryById(id);

    if (!entry) {
      notFound();
    }

    return (
      <div className="mx-auto grid max-w-4xl gap-6">
        <header className="border-b border-border pb-5">
          <p className="text-sm font-medium text-primary">Edit entry</p>
          <h1 className="mt-1 text-3xl font-semibold">{entry.title}</h1>
          <Link
            href={`/entries/${entry.id}`}
            className="mt-3 inline-flex text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Back to entry
          </Link>
        </header>

        <section className="border border-border bg-surface p-5">
          <EditEntryForm entry={entry} />
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
