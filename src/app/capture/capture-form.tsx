"use client";

import { useActionState, useEffect, useRef } from "react";

import { initialMutationState } from "@/application/action-states";
import { EntryTypeField } from "@/components/entry-type-field";
import { entryStatuses, privacyLevels } from "@/domain/context";
import { Alert, Button, Field } from "@/components/ui";
import { labelize } from "@/lib/format";

import { createEntryAction } from "./actions";

export function CaptureForm() {
  const [state, formAction, pending] = useActionState(createEntryAction, initialMutationState);
  // Set the max date on the DOM after mount so server and client render the same
  // initial markup (avoids a hydration mismatch when the render straddles midnight).
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

      <Field name="body" label="Note" required errors={state.fieldErrors?.body}>
        {(p) => (
          <textarea
            className="field-textarea min-h-44"
            placeholder="Write your thought, observation, question, or decision…"
            {...p}
          />
        )}
      </Field>

      <Field
        name="title"
        label={
          <>
            Title <span className="font-normal text-muted-foreground">(optional)</span>
          </>
        }
        errors={state.fieldErrors?.title}
      >
        {(p) => (
          <input className="field-input" placeholder="Leave empty to auto-generate from the note" {...p} />
        )}
      </Field>

      <div className="grid items-start gap-4 md:grid-cols-3">
        <EntryTypeField />

        <Field name="status" label="Status">
          {(p) => (
            <select className="field-select" defaultValue="active" {...p}>
              {entryStatuses.map((s) => (
                <option key={s} value={s}>{labelize(s)}</option>
              ))}
            </select>
          )}
        </Field>

        <Field name="privacyLevel" label="Privacy">
          {(p) => (
            <select className="field-select" defaultValue="private" {...p}>
              {privacyLevels.map((level) => (
                <option key={level} value={level}>{labelize(level)}</option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field name="summary" label="Summary">
        {(p) => (
          <textarea
            className="field-textarea min-h-24"
            placeholder="Optional compact summary for scanning and AI context."
            {...p}
          />
        )}
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field name="themes" label="Themes" hint="Comma-separated. New themes are created automatically.">
          {(p) => <input className="field-input" placeholder="AI, architecture, daily use" {...p} />}
        </Field>
        <Field name="projects" label="Projects" hint="Comma-separated. New projects are created automatically.">
          {(p) => <input className="field-input" placeholder="personal-context-system" {...p} />}
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field name="occurredAt" label="Occurred at">
          {(p) => <input ref={occurredAtRef} className="field-input" type="date" {...p} />}
        </Field>
        <Field
          name="confidence"
          label={
            <>
              Confidence <span className="font-normal text-muted-foreground">(0–1)</span>
            </>
          }
          hint="Certainty score from 0 (guess) to 1 (verified)."
        >
          {(p) => (
            <input
              className="field-input"
              inputMode="decimal"
              max="1"
              min="0"
              placeholder="0.8"
              step="0.1"
              type="number"
              {...p}
            />
          )}
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field name="url" label="URL">
          {(p) => (
            <input
              className="field-input"
              placeholder="https://… creates a reference linked to this entry"
              type="url"
              {...p}
            />
          )}
        </Field>
        <Field name="source" label="Source">
          {(p) => <input className="field-input" placeholder="self, conversation, article" {...p} />}
        </Field>
      </div>

      <div className="flex justify-end border-t border-border pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save entry"}
        </Button>
      </div>
    </form>
  );
}
