"use client";

import { useActionState, useRef, useState } from "react";

import { Button, Field } from "@/components/ui";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormMessage } from "@/components/form-message";
import { RenameForm } from "@/components/rename-form";
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
  return (
    <RenameForm
      action={updateThemeAction.bind(null, themeId)}
      name={name}
      description={description}
      maxLength={160}
    />
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
        <Field name="targetThemeId" label="Merge into" required>
          {(p) => (
            <select
              className="field-select"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              {...p}
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
          )}
        </Field>
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
