"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { initialMutationState, promoteEntryToQuestionAction } from "./actions";

export function PromoteQuestionForm({ entryId }: { entryId: string }) {
  const actionWithEntry = promoteEntryToQuestionAction.bind(null, entryId);
  const [state, action, pending] = useActionState(actionWithEntry, initialMutationState);

  return (
    <form action={action} className="grid gap-2 sm:justify-items-end">
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Promoting..." : "Promote to question"}
      </Button>
      {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
    </form>
  );
}
