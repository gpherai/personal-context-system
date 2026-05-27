"use client";

import { useActionState, useEffect, useId } from "react";

import { EntryTypeField } from "@/components/entry-type-field";
import { Button } from "@/components/ui/button";
import { entryStatuses, privacyLevels, type EntryType, type EntryStatus, type PrivacyLevel } from "@/domain/context";

import { initialMutationState } from "@/application/action-states";

import { updateEntryAction } from "./actions";

interface EditEntryDto {
  id: string;
  type: EntryType;
  status: EntryStatus;
  privacyLevel: PrivacyLevel;
  title: string;
  body: string;
  summary?: string;
  source?: string;
  confidence?: number;
  occurredAt?: Date;
  themes: { name: string }[];
  projects: { name: string }[];
}

function dateInputValue(value?: Date): string {
  return value ? value.toISOString().slice(0, 10) : "";
}

function namesValue(records: { name: string }[]): string {
  return records.map((record) => record.name).join(", ");
}

function FieldError({ id, errors }: { id?: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-danger">
      {errors[0]}
    </p>
  );
}

export function EditEntryForm({ entry }: { entry: EditEntryDto }) {
  const updateEntryWithId = updateEntryAction.bind(null, entry.id);
  const [state, formAction, pending] = useActionState(updateEntryWithId, initialMutationState);
  const formId = useId();

  const ids = {
    title:      `${formId}-title`,
    body:       `${formId}-body`,
    titleError: `${formId}-title-error`,
    bodyError:  `${formId}-body-error`,
  };

  useEffect(() => {
    if (state.status === "error") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.status, state.message]);

  return (
    <form action={formAction} className="grid gap-5">
      {state.status === "error" && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger"
        >
          {state.message ?? "The entry could not be saved."}
        </div>
      )}

      <div className="grid items-start gap-4 md:grid-cols-3">
        <EntryTypeField defaultValue={entry.type} />

        <label className="grid gap-1.5 text-sm font-medium">
          Status
          <select className="field-select" name="status" defaultValue={entry.status}>
            {entryStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Privacy
          <select className="field-select" name="privacyLevel" defaultValue={entry.privacyLevel}>
            {privacyLevels.map((privacy) => (
              <option key={privacy} value={privacy}>{privacy}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor={ids.title} className="text-sm font-medium">Title</label>
        <input
          id={ids.title}
          className="field-input"
          name="title"
          defaultValue={entry.title}
          aria-describedby={state.fieldErrors?.title ? ids.titleError : undefined}
          aria-invalid={!!state.fieldErrors?.title || undefined}
        />
        <FieldError id={ids.titleError} errors={state.fieldErrors?.title} />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor={ids.body} className="text-sm font-medium">
          Body <span aria-hidden="true" className="text-danger">*</span>
        </label>
        <textarea
          id={ids.body}
          className="field-textarea min-h-52"
          name="body"
          defaultValue={entry.body}
          required
          aria-describedby={state.fieldErrors?.body ? ids.bodyError : undefined}
          aria-invalid={!!state.fieldErrors?.body || undefined}
        />
        <FieldError id={ids.bodyError} errors={state.fieldErrors?.body} />
      </div>

      <label className="grid gap-1.5 text-sm font-medium">
        Summary
        <textarea
          className="field-textarea min-h-24"
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
            max={new Date().toISOString().split("T")[0]}
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
          Confidence <span className="font-normal text-muted-foreground">(0–1)</span>
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
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
