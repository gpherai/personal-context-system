import { notFound } from "next/navigation";

import { isRecoverableReadError } from "@/application/errors";
import { getQuestionById } from "@/application/query-service";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const question = await getQuestionById(id);

    if (!question) {
      notFound();
    }

    return (
      <div className="mx-auto grid max-w-5xl gap-5">
        <header className="border-b border-border pb-5">
          <Badge tone="amber">{question.status}</Badge>
          <h1 className="mt-3 text-3xl font-semibold">{question.prompt}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Updated {formatDateTime(question.updatedAt)}</p>
          {question.summary && <p className="mt-3 text-sm leading-6 text-muted-foreground">{question.summary}</p>}
        </header>
        <EntryList entries={question.entries} />
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
