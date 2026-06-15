"use client";

import { useActionState } from "react";

import { QuestionStatusField } from "@/components/question-status-field";
import { Button } from "@/components/ui/button";
import { privacyLevels, type PrivacyLevel, type QuestionStatus } from "@/domain/context";

import { initialMutationState } from "@/application/action-states";

import { updateQuestionAction } from "./actions";

interface QuestionUpdateDto {
  id: string;
  status: QuestionStatus;
  privacyLevel: PrivacyLevel;
  summary?: string;
}

function Message({ state }: { state: typeof initialMutationState }) {
  if (!state.message) {
    return null;
  }

  return <p role="status" aria-live="polite" className={state.status === "error" ? "text-sm text-danger" : "text-sm text-accent"}>{state.message}</p>;
}

export function QuestionUpdateForm({ question }: { question: QuestionUpdateDto }) {
  const actionWithQuestion = updateQuestionAction.bind(null, question.id);
  const [state, action, pending] = useActionState(actionWithQuestion, initialMutationState);

  return (
    <form action={action} className="grid gap-3">
      <QuestionStatusField defaultValue={question.status} />
      <label className="grid gap-1.5 text-sm font-medium">
        Privacy
        <select className="field-select" name="privacyLevel" defaultValue={question.privacyLevel}>
          {privacyLevels.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Summary
        <textarea
          className="min-h-24 rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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

