"use client";

import { useActionState } from "react";

import { RelationshipTargetSelect } from "@/components/relationship-target-select";
import { Button } from "@/components/ui/button";
import { questionStatuses, relationTypes } from "@/domain/context";
import { labelize } from "@/lib/format";
import type { QuestionContext, RelationshipTarget } from "@/repositories/context-repository";

import { initialMutationState, linkFromQuestionAction, updateQuestionAction } from "./actions";

function Message({ state }: { state: typeof initialMutationState }) {
  if (!state.message) {
    return null;
  }

  return <p className={state.status === "error" ? "text-sm text-danger" : "text-sm text-accent"}>{state.message}</p>;
}

export function QuestionUpdateForm({ question }: { question: QuestionContext }) {
  const actionWithQuestion = updateQuestionAction.bind(null, question.id);
  const [state, action, pending] = useActionState(actionWithQuestion, initialMutationState);

  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-2 text-sm font-medium">
        Status
        <select
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          name="status"
          defaultValue={question.status}
        >
          {questionStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Summary
        <textarea
          className="min-h-24 rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          name="summary"
          defaultValue={question.summary ?? ""}
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save question"}
        </Button>
        <Message state={state} />
      </div>
    </form>
  );
}

export function QuestionRelationshipForm({ questionId, targets }: { questionId: string; targets: RelationshipTarget[] }) {
  const actionWithQuestion = linkFromQuestionAction.bind(null, questionId);
  const [state, action, pending] = useActionState(actionWithQuestion, initialMutationState);

  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <RelationshipTargetSelect targets={targets} source={{ objectType: "question", objectId: questionId }} />
        <label className="grid gap-2 text-sm font-medium">
          Relation
          <select
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            name="relationType"
            defaultValue="relates_to"
          >
            {relationTypes.map((type) => (
              <option key={type} value={type}>
                {labelize(type)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        Note
        <input
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          name="note"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Linking..." : "Create link"}
        </Button>
        <Message state={state} />
      </div>
    </form>
  );
}
