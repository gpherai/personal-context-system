import Link from "next/link";
import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { getQuestionById, getRelationshipTargets } from "@/application/query-service";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, isValidId, labelize } from "@/lib/format";

import { QuestionRelationshipForm, QuestionUpdateForm } from "./question-forms";

export const dynamic = "force-dynamic";

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isValidId(id)) notFound();

  try {
    const [question, relationshipTargets] = await Promise.all([getQuestionById(id), getRelationshipTargets()]);

    if (!question) {
      notFound();
    }

    const targetLabelMap = new Map(
      relationshipTargets.map((t) => [`${t.objectType}:${t.objectId}`, t.label])
    );

    return (
      <div className="mx-auto grid max-w-5xl gap-5">
        <header className="border-b border-border pb-5">
          <Badge tone="amber">{question.status}</Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{question.prompt}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>Updated {formatDateTime(question.updatedAt)}</span>
            {question.originEntryId && (
              <Link
                href={`/entries/${question.originEntryId}`}
                className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Origin entry
              </Link>
            )}
          </div>
          {question.summary && <p className="mt-3 text-sm leading-6 text-muted-foreground">{question.summary}</p>}
        </header>

        <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-3">
            <h2 className="text-lg font-semibold">Linked entries</h2>
            <EntryList entries={question.entries} />
          </div>
          <aside className="grid content-start gap-4">
            <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold">Question workflow</h2>
              <QuestionUpdateForm question={question} />
            </div>
            <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold">Create relationship</h2>
              <QuestionRelationshipForm questionId={question.id} targets={relationshipTargets} />
            </div>
          </aside>
        </section>

        <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Relationships</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Outgoing</h3>
              <div className="mt-2 grid gap-2">
                {question.outgoingRelationships.length ? (
                  question.outgoingRelationships.map((relationship) => (
                    <p key={relationship.id} className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{labelize(relationship.relationType)}</span>{" "}
                      {targetLabelMap.get(`${relationship.toType}:${relationship.toId}`) ?? `${relationship.toType}:${relationship.toId}`}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No outgoing relationships.</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Incoming</h3>
              <div className="mt-2 grid gap-2">
                {question.incomingRelationships.length ? (
                  question.incomingRelationships.map((relationship) => (
                    <p key={relationship.id} className="text-sm text-muted-foreground">
                      {targetLabelMap.get(`${relationship.fromType}:${relationship.fromId}`) ?? `${relationship.fromType}:${relationship.fromId}`}{" "}
                      <span className="font-medium text-foreground">{labelize(relationship.relationType)}</span>
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No incoming relationships.</p>
                )}
              </div>
            </div>
          </div>
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
