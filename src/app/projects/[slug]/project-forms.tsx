"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/form-message";
import { initialMutationState } from "@/application/action-states";
import type { RecordStatus } from "@/domain/context";

import { updateProjectAction } from "./actions";

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
        Name
        <input className="field-input" name="name" defaultValue={name} required maxLength={180} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Description
        <textarea
          className="field-textarea min-h-20"
          name="description"
          defaultValue={description ?? ""}
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <FormMessage state={state} />
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
        {pending ? "Working…" : nextStatus === "archived" ? "Archive" : "Activate"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
