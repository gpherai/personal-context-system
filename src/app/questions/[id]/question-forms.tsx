"use client";

import { useActionState } from "react";

import { QuestionStatusField } from "@/components/question-status-field";
import { Button } from "@/components/ui/button";
import { privacyLevels, type PrivacyLevel, type QuestionStatus } from "@/domain/context";
import { labelize } from "@/lib/format";

import { FormMessage } from "@/components/form-message";
import { initialMutationState } from "@/application/action-states";

import { updateQuestionAction } from "./actions";

interface QuestionUpdateDto {
  id: string;
  status: QuestionStatus;
  privacyLevel: PrivacyLevel;
  summary?: string;
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
            <option key={p} value={p}>{labelize(p)}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Summary
        <textarea
          className="field-textarea min-h-24"
          name="summary"
          defaultValue={question.summary ?? ""}
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save question"}
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

