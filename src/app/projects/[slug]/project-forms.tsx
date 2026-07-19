"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui";
import { FormMessage } from "@/components/form-message";
import { RenameForm } from "@/components/rename-form";
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
  return (
    <RenameForm
      action={updateProjectAction.bind(null, projectId)}
      name={name}
      description={description}
      maxLength={180}
      // The update action validates the whole record, so the status the form
      // does not edit still has to travel with it.
      hidden={{ status }}
    />
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
