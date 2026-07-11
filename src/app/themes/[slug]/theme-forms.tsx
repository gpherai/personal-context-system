"use client";

import { useActionState, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormMessage } from "@/components/form-message";
import { initialMutationState } from "@/application/action-states";

import { mergeThemeAction, updateThemeAction } from "./actions";

export function RenameThemeForm({
  themeId,
  name,
  description
}: {
  themeId: string;
  name: string;
  description?: string;
}) {
  const actionWithId = updateThemeAction.bind(null, themeId);
  const [state, action, pending] = useActionState(actionWithId, initialMutationState);

  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-1.5 text-sm font-medium">
        Name
        <input className="field-input" name="name" defaultValue={name} required maxLength={160} />
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

export function MergeThemeForm({
  themeId,
  otherThemes
}: {
  themeId: string;
  otherThemes: { id: string; name: string }[];
}) {
  const actionWithId = mergeThemeAction.bind(null, themeId);
  const [state, action, pending] = useActionState(actionWithId, initialMutationState);
  const [target, setTarget] = useState("");
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (otherThemes.length === 0) {
    return <p className="text-sm text-muted-foreground">No other themes to merge into.</p>;
  }

  return (
    <>
      <form ref={formRef} action={action} className="grid gap-3">
        <label className="grid gap-1.5 text-sm font-medium">
          Merge into
          <select
            className="field-select"
            name="targetThemeId"
            required
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            <option value="" disabled>
              Choose a target theme
            </option>
            {otherThemes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={pending || !target}
            onClick={() => setOpen(true)}
          >
            {pending ? "Merging…" : "Merge themes"}
          </Button>
          <FormMessage state={state} />
        </div>
      </form>

      <ConfirmDialog
        open={open}
        title="Merge themes"
        message="This deletes this theme and moves all its links to the target theme. This cannot be undone."
        confirmLabel="Merge"
        tone="primary"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
