"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/form-message";
import { initialMutationState } from "@/application/action-states";

import { addEntryToThreadAction } from "./actions";

export function AddEntryToThreadForm({
  threadSlug,
  threadId,
  entryOptions
}: {
  threadSlug: string;
  threadId: string;
  entryOptions: { id: string; title: string }[];
}) {
  const actionWithThread = addEntryToThreadAction.bind(null, threadSlug, threadId);
  const [state, action, pending] = useActionState(actionWithThread, initialMutationState);

  if (entryOptions.length === 0) {
    return <p className="text-sm text-muted-foreground">No unlinked entries available to add.</p>;
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="grid min-w-64 flex-1 gap-1.5 text-sm font-medium">
        Entry
        <select className="field-select" name="entryId" required defaultValue="">
          <option value="" disabled>
            Choose an entry
          </option>
          {entryOptions.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Adding…" : "Add to thread"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
