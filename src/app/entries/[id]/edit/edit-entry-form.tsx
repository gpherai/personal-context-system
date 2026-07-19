"use client";

import { useActionState, useEffect, useRef } from "react";

import { EntryTypeField } from "@/components/entry-type-field";
import { Alert, Button, Field } from "@/components/ui";
import { entryStatuses, privacyLevels, type EntryType, type EntryStatus, type PrivacyLevel } from "@/domain/context";
import { labelize } from "@/lib/format";

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

export function EditEntryForm({ entry }: { entry: EditEntryDto }) {
  const updateEntryWithId = updateEntryAction.bind(null, entry.id);
  const [state, formAction, pending] = useActionState(updateEntryWithId, initialMutationState);
  // Set the max date on the DOM after mount so SSR and client render identical
  // markup (avoids a hydration mismatch when the render straddles midnight).
  const occurredAtRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (occurredAtRef.current) occurredAtRef.current.max = new Date().toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    if (state.status === "error") {
      const errorElement = document.querySelector('[aria-invalid="true"]');
      if (errorElement instanceof HTMLElement) {
        errorElement.focus();
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [state.status, state.message]);

  return (
    <form action={formAction} className="grid gap-4">
      {state.status === "error" && (
        <Alert live tone="danger">{state.message ?? "The entry could not be saved."}</Alert>
      )}

      <div className="grid items-start gap-4 md:grid-cols-3">
        <EntryTypeField defaultValue={entry.type} />

        <Field name="status" label="Status">
          {(p) => (
            <select className="field-select" defaultValue={entry.status} {...p}>
              {entryStatuses.map((status) => (
                <option key={status} value={status}>{labelize(status)}</option>
              ))}
            </select>
          )}
        </Field>

        <Field name="privacyLevel" label="Privacy">
          {(p) => (
            <select className="field-select" defaultValue={entry.privacyLevel} {...p}>
              {privacyLevels.map((privacy) => (
                <option key={privacy} value={privacy}>{labelize(privacy)}</option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field name="title" label="Title" errors={state.fieldErrors?.title}>
        {(p) => <input className="field-input" defaultValue={entry.title} {...p} />}
      </Field>

      <Field name="body" label="Body" required errors={state.fieldErrors?.body}>
        {(p) => <textarea className="field-textarea min-h-52" defaultValue={entry.body} {...p} />}
      </Field>

      <Field name="summary" label="Summary">
        {(p) => <textarea className="field-textarea min-h-24" defaultValue={entry.summary ?? ""} {...p} />}
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field name="themes" label="Themes">
          {(p) => <input className="field-input" defaultValue={namesValue(entry.themes)} {...p} />}
        </Field>
        <Field name="projects" label="Projects">
          {(p) => <input className="field-input" defaultValue={namesValue(entry.projects)} {...p} />}
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field name="occurredAt" label="Occurred at">
          {(p) => (
            <input
              ref={occurredAtRef}
              className="field-input"
              type="date"
              defaultValue={dateInputValue(entry.occurredAt)}
              {...p}
            />
          )}
        </Field>

        <Field name="source" label="Source">
          {(p) => <input className="field-input" defaultValue={entry.source ?? ""} {...p} />}
        </Field>

        <Field
          name="confidence"
          label={
            <>
              Confidence <span className="font-normal text-muted-foreground">(0–1)</span>
            </>
          }
        >
          {(p) => (
            <input
              className="field-input"
              inputMode="decimal"
              max="1"
              min="0"
              step="0.1"
              type="number"
              defaultValue={entry.confidence ?? ""}
              {...p}
            />
          )}
        </Field>
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
