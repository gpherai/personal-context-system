"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import { initialMutationState } from "@/application/action-states";
import { EntryTypeField } from "@/components/entry-type-field";
import { entryStatuses, privacyLevels } from "@/domain/context";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/field-error";
import { labelize } from "@/lib/format";

import { createEntryAction } from "./actions";

export function CaptureForm() {
  const [state, formAction, pending] = useActionState(createEntryAction, initialMutationState);
  const formId = useId();
  // Set the max date on the DOM after mount so server and client render the same
  // initial markup (avoids a hydration mismatch when the render straddles midnight).
  const occurredAtRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (occurredAtRef.current) occurredAtRef.current.max = new Date().toISOString().split("T")[0];
  }, []);

  const ids = {
    title:         `${formId}-title`,
    body:          `${formId}-body`,
    titleError:    `${formId}-title-error`,
    bodyError:     `${formId}-body-error`,
    themes:        `${formId}-themes`,
    themesHint:    `${formId}-themes-hint`,
    projects:      `${formId}-projects`,
    projectsHint:  `${formId}-projects-hint`,
    confidence:    `${formId}-confidence`,
    confidenceHint:`${formId}-confidence-hint`,
  };

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
    <form action={formAction} className="grid gap-5">
      {state.status === "error" && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger"
        >
          {state.message ?? "The entry could not be saved."}
        </div>
      )}

      <div className="grid gap-1.5">
        <label htmlFor={ids.body} className="text-sm font-medium">
          Note <span aria-hidden="true" className="text-danger">*</span>
        </label>
        <textarea
          id={ids.body}
          className="field-textarea min-h-44"
          name="body"
          placeholder="Write your thought, observation, question, or decision…"
          required
          aria-describedby={state.fieldErrors?.body ? ids.bodyError : undefined}
          aria-invalid={!!state.fieldErrors?.body || undefined}
        />
        <FieldError id={ids.bodyError} errors={state.fieldErrors?.body} />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor={ids.title} className="text-sm font-medium">
          Title <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id={ids.title}
          className="field-input"
          name="title"
          placeholder="Leave empty to auto-generate from the note"
          aria-describedby={state.fieldErrors?.title ? ids.titleError : undefined}
          aria-invalid={!!state.fieldErrors?.title || undefined}
        />
        <FieldError id={ids.titleError} errors={state.fieldErrors?.title} />
      </div>

      <div className="grid items-start gap-4 md:grid-cols-3">
        <EntryTypeField />

        <label className="grid gap-1.5 text-sm font-medium">
          Status
          <select className="field-select" name="status" defaultValue="active">
            {entryStatuses.map((s) => (
              <option key={s} value={s}>{labelize(s)}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Privacy
          <select className="field-select" name="privacyLevel" defaultValue="private">
            {privacyLevels.map((p) => (
              <option key={p} value={p}>{labelize(p)}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-medium">
        Summary
        <textarea
          className="field-textarea min-h-24"
          name="summary"
          placeholder="Optional compact summary for scanning and AI context."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor={ids.themes} className="text-sm font-medium">Themes</label>
          <input
            id={ids.themes}
            className="field-input"
            name="themes"
            placeholder="AI, architecture, daily use"
            aria-describedby={ids.themesHint}
          />
          <p id={ids.themesHint} className="text-xs leading-5 text-muted-foreground">
            Comma-separated. New themes are created automatically.
          </p>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor={ids.projects} className="text-sm font-medium">Projects</label>
          <input
            id={ids.projects}
            className="field-input"
            name="projects"
            placeholder="personal-context-system"
            aria-describedby={ids.projectsHint}
          />
          <p id={ids.projectsHint} className="text-xs leading-5 text-muted-foreground">
            Comma-separated. New projects are created automatically.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Occurred at
          <input
            ref={occurredAtRef}
            className="field-input"
            name="occurredAt"
            type="date"
          />
        </label>
        <div className="grid gap-1.5">
          <label htmlFor={ids.confidence} className="text-sm font-medium">
            Confidence{" "}
            <span className="font-normal text-muted-foreground">(0–1)</span>
          </label>
          <input
            id={ids.confidence}
            className="field-input"
            inputMode="decimal"
            max="1"
            min="0"
            name="confidence"
            placeholder="0.8"
            step="0.1"
            type="number"
            aria-describedby={ids.confidenceHint}
          />
          <p id={ids.confidenceHint} className="text-xs leading-5 text-muted-foreground">
            Certainty score from 0 (guess) to 1 (verified).
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          URL
          <input
            className="field-input"
            name="url"
            placeholder="https://… creates a reference linked to this entry"
            type="url"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Source
          <input
            className="field-input"
            name="source"
            placeholder="self, conversation, article"
          />
        </label>
      </div>

      <div className="flex justify-end border-t border-border pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save entry"}
        </Button>
      </div>
    </form>
  );
}
