"use client";

import { useActionState } from "react";

import { initialMutationState, type MutationState } from "@/application/action-states";
import { FormMessage } from "@/components/form-message";
import { Button, Field } from "@/components/ui";

/**
 * Name + description editor for a taxonomy record. Themes and projects had
 * near-identical copies of this; the only real differences were the name length
 * cap and the extra hidden fields a project needs to keep its status.
 */
export function RenameForm({
  action,
  name,
  description,
  maxLength,
  hidden,
}: {
  action: (state: MutationState, formData: FormData) => Promise<MutationState>;
  name: string;
  description?: string;
  maxLength: number;
  /** Fields the update action requires but this form does not edit. */
  hidden?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, initialMutationState);

  return (
    <form action={formAction} className="grid gap-3">
      {Object.entries(hidden ?? {}).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <Field name="name" label="Name" required errors={state.fieldErrors?.name}>
        {(p) => <input className="field-input" defaultValue={name} maxLength={maxLength} {...p} />}
      </Field>
      <Field name="description" label="Description" errors={state.fieldErrors?.description}>
        {(p) => <textarea className="field-textarea min-h-20" defaultValue={description ?? ""} {...p} />}
      </Field>
      <div className="grid gap-3">
        <Button type="submit" variant="secondary" className="w-fit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
