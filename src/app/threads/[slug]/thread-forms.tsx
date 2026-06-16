"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { initialMutationState } from "@/application/action-states";

import { addEntryToThreadAction } from "./actions";

function Message({ state }: { state: typeof initialMutationState }) {
  if (!state.message) {
    return null;
  }

  return <p className={state.status === "error" ? "text-sm text-danger" : "text-sm text-accent"}>{state.message}</p>;
}

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
    return <p className="text-sm text-muted-foreground">Geen losse notities beschikbaar om toe te voegen.</p>;
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="grid min-w-64 flex-1 gap-1.5 text-sm font-medium">
        Notitie
        <select className="field-select" name="entryId" required defaultValue="">
          <option value="" disabled>
            Kies een notitie
          </option>
          {entryOptions.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Toevoegen..." : "Toevoegen aan draad"}
      </Button>
      <Message state={state} />
    </form>
  );
}
