import Link from "next/link";
import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { getQuestionById } from "@/application/query-service";
import { DeleteForm } from "@/components/delete-form";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, isValidId, labelize } from "@/lib/format";

import { deleteQuestionAction } from "./actions";
import { DecisionForm, DecisionHistory, TaskForm, TaskList } from "./decision-task-forms";
import { QuestionUpdateForm } from "./question-forms";

export const dynamic = "force-dynamic";

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isValidId(id)) notFound();

  try {
    const question = await getQuestionById(id);

    if (!question) {
      notFound();
    }

    return (
      <div className="mx-auto grid max-w-5xl gap-5">
        <header className="border-b border-border pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge tone="amber">{labelize(question.status)}</Badge>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">{question.prompt}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>Bijgewerkt {formatDateTime(question.updatedAt)}</span>
                {question.originEntryId && (
                  <Link
                    href={`/entries/${question.originEntryId}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    Oorspronkelijke notitie
                  </Link>
                )}
              </div>
              {question.summary && <p className="mt-3 text-sm leading-6 text-muted-foreground">{question.summary}</p>}
            </div>
            <DeleteForm
              action={deleteQuestionAction.bind(null, question.id)}
              confirmMessage="Vraag permanent verwijderen?"
              className="shrink-0"
            >
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-md border border-danger/30 bg-danger/8 px-4 text-sm font-medium text-danger transition-colors duration-200 hover:bg-danger/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
              >
                Verwijderen
              </button>
            </DeleteForm>
          </div>
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
              <h2 className="mb-3 text-sm font-semibold">Decisions</h2>
              <DecisionHistory decisions={question.decisions} questionId={question.id} />
              <div className="mt-4 border-t border-border pt-4">
                <DecisionForm questionId={question.id} />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold">Tasks</h2>
              <TaskList tasks={question.tasks} questionId={question.id} />
              <div className="mt-4 border-t border-border pt-4">
                <TaskForm questionId={question.id} />
              </div>
            </div>
          </aside>
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
