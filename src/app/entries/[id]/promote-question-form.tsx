"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/form-message";

import { initialMutationState } from "@/application/action-states";

import { promoteEntryToQuestionAction } from "./actions";

export function PromoteQuestionForm({ entryId }: { entryId: string }) {
  const actionWithEntry = promoteEntryToQuestionAction.bind(null, entryId);
  const [state, action, pending] = useActionState(actionWithEntry, initialMutationState);

  return (
    <form action={action} className="grid gap-1.5">
      <Button type="submit" variant="secondary" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Promoting…" : "Promote to question"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
