"use client";

import { useActionState } from "react";

import { initialCaptureEntryState } from "@/application/action-states";
import { EntryTypeField } from "@/components/entry-type-field";
import { entryStatuses, privacyLevels } from "@/domain/context";
import { Button } from "@/components/ui/button";

import { createEntryAction } from "./actions";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-danger">{errors[0]}</p>;
}

export function CaptureForm() {
  const [state, formAction, pending] = useActionState(createEntryAction, initialCaptureEntryState);

  return (
    <form action={formAction} className="grid gap-5">
      {state.status === "error" && (
        <div className="rounded-lg border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">
          {state.message ?? "The entry could not be saved."}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <EntryTypeField />

        <label className="grid gap-1.5 text-sm font-medium">
          Status
          <select className="field-select" name="status" defaultValue="active">
            {entryStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Privacy
          <select className="field-select" name="privacyLevel" defaultValue="private">
            {privacyLevels.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-medium">
        Title
        <input className="field-input" name="title" placeholder="A concise title" />
        <FieldError errors={state.fieldErrors?.title} />
      </label>

      <label className="grid gap-1.5 text-sm font-medium">
        Body
        <textarea
          className="field-textarea min-h-44"
          name="body"
          placeholder="Capture the thought, observation, question, or decision."
          required
        />
        <FieldError errors={state.fieldErrors?.body} />
      </label>

      <label className="grid gap-1.5 text-sm font-medium">
        Summary
        <textarea
          className="field-textarea min-h-24"
          name="summary"
          placeholder="Optional compact summary for scanning and AI context."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Themes
          <input
            className="field-input"
            name="themes"
            placeholder="AI, architecture, daily use"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Projects
          <input
            className="field-input"
            name="projects"
            placeholder="personal-context-system"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-medium">
          Occurred at
          <input className="field-input" name="occurredAt" type="date" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Source
          <input
            className="field-input"
            name="source"
            placeholder="self, Codex, article, conversation"
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
            placeholder="0.8"
            step="0.1"
            type="number"
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
