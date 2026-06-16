"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { initialMutationState } from "@/application/action-states";
import type { RecordStatus } from "@/domain/context";

import { updateProjectAction } from "./actions";

function Message({ state }: { state: typeof initialMutationState }) {
  if (!state.message) {
    return null;
  }

  return <p className={state.status === "error" ? "text-sm text-danger" : "text-sm text-accent"}>{state.message}</p>;
}

export function RenameProjectForm({
  projectId,
  name,
  description,
  status
}: {
  projectId: string;
  name: string;
  description?: string;
  status: RecordStatus;
}) {
  const actionWithId = updateProjectAction.bind(null, projectId);
  const [state, action, pending] = useActionState(actionWithId, initialMutationState);

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="status" value={status} />
      <label className="grid gap-1.5 text-sm font-medium">
        Naam
        <input className="field-input" name="name" defaultValue={name} required maxLength={180} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Beschrijving
        <textarea
          className="min-h-20 rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          name="description"
          defaultValue={description ?? ""}
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Opslaan..." : "Opslaan"}
        </Button>
        <Message state={state} />
      </div>
    </form>
  );
}

export function ArchiveProjectForm({
  projectId,
  name,
  description,
  status
}: {
  projectId: string;
  name: string;
  description?: string;
  status: RecordStatus;
}) {
  const actionWithId = updateProjectAction.bind(null, projectId);
  const [state, action, pending] = useActionState(actionWithId, initialMutationState);
  const nextStatus = status === "active" ? "archived" : "active";

  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="description" value={description ?? ""} />
      <input type="hidden" name="status" value={nextStatus} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Bezig..." : nextStatus === "archived" ? "Archiveren" : "Activeren"}
      </Button>
      <Message state={state} />
    </form>
  );
}
