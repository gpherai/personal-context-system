"use client";

import { useActionState } from "react";

import { EntryTypeField } from "@/components/entry-type-field";
import { Button } from "@/components/ui/button";
import { entryStatuses, privacyLevels } from "@/domain/context";
import type { EntryRecord } from "@/repositories/context-repository";

import { initialMutationState } from "@/application/action-states";

import { updateEntryAction } from "./actions";

function dateInputValue(value?: Date): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

function namesValue(records: { name: string }[]): string {
  return records.map((record) => record.name).join(", ");
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="mt-1 text-sm text-danger">{errors[0]}</p>;
}

export function EditEntryForm({ entry }: { entry: EntryRecord }) {
  const updateEntryWithId = updateEntryAction.bind(null, entry.id);
  const [state, formAction, pending] = useActionState(updateEntryWithId, initialMutationState);

  return (
    <form action={formAction} className="grid gap-5">
      {state.status === "error" && (
        <div className="border-l-4 border-danger bg-danger/8 px-4 py-3 text-sm text-danger">
          {state.message ?? "The entry could not be saved."}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <EntryTypeField defaultValue={entry.type} />

        <label className="grid gap-1.5 text-sm font-medium">
          Status
          <select
            className="field-input"
            name="status"
            defaultValue={entry.status}
          >
            {entryStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Privacy
          <select
            className="field-input"
            name="privacyLevel"
            defaultValue={entry.privacyLevel}
          >
            {privacyLevels.map((privacy) => (
              <option key={privacy} value={privacy}>
                {privacy}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-medium">
        Title
        <input
          className="field-input"
          name="title"
          defaultValue={entry.title}
        />
        <FieldError errors={state.fieldErrors?.title} />
      </label>

      <label className="grid gap-1.5 text-sm font-medium">
        Body
        <textarea
          className="min-h-52 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          name="body"
          defaultValue={entry.body}
          required
        />
        <FieldError errors={state.fieldErrors?.body} />
      </label>

      <label className="grid gap-1.5 text-sm font-medium">
        Summary
        <textarea
          className="min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          name="summary"
          defaultValue={entry.summary ?? ""}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Themes
          <input
            className="field-input"
            name="themes"
            defaultValue={namesValue(entry.themes)}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Projects
          <input
            className="field-input"
            name="projects"
            defaultValue={namesValue(entry.projects)}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-medium">
          Occurred at
          <input
            className="field-input"
            name="occurredAt"
            type="date"
            defaultValue={dateInputValue(entry.occurredAt)}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Source
          <input
            className="field-input"
            name="source"
            defaultValue={entry.source ?? ""}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Confidence
          <input
            className="field-input"
            inputMode="decimal"
            max="1"
            min="0"
            name="confidence"
            step="0.1"
            type="number"
            defaultValue={entry.confidence ?? ""}
          />
        </label>
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
