import Link from "next/link";
import { notFound } from "next/navigation";

import { isDatabaseUnavailable } from "@/application/errors";
import { getQuestionById } from "@/application/query-service";
import { DeleteForm } from "@/components/delete-form";
import { EntryList } from "@/components/entry-list";
import { SetupNotice } from "@/components/setup-notice";
import { Badge, DetailHeader, Panel, PanelTitle } from "@/components/ui";
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
      <div className="mx-auto grid max-w-4xl gap-6">
        <DetailHeader
          badges={<Badge tone="amber">{labelize(question.status)}</Badge>}
          title={question.prompt}
          description={question.summary}
          meta={
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>Updated {formatDateTime(question.updatedAt)}</span>
              {question.originEntryId && (
                <Link
                  href={`/entries/${question.originEntryId}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Original entry
                </Link>
              )}
            </div>
          }
          actions={
            <DeleteForm
              action={deleteQuestionAction.bind(null, question.id)}
              title="Delete question"
              message="This permanently deletes the question and its decisions/tasks. This cannot be undone."
              triggerLabel="Delete"
            />
          }
        />

        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-4">
            <h2 className="text-base font-semibold">Linked entries</h2>
            <EntryList entries={question.entries} />
          </div>
          <aside className="grid content-start gap-4">
            <Panel>
              <PanelTitle>Question workflow</PanelTitle>
              <QuestionUpdateForm question={question} />
            </Panel>
            <Panel>
              <PanelTitle>Decisions</PanelTitle>
              <DecisionHistory decisions={question.decisions} questionId={question.id} />
              <div className="mt-4 border-t border-border pt-4">
                <DecisionForm questionId={question.id} />
              </div>
            </Panel>
            <Panel>
              <PanelTitle>Tasks</PanelTitle>
              <TaskList tasks={question.tasks} questionId={question.id} />
              <div className="mt-4 border-t border-border pt-4">
                <TaskForm questionId={question.id} />
              </div>
            </Panel>
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
