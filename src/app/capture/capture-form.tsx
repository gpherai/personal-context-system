"use client";

import { useActionState } from "react";

import { initialCaptureEntryState } from "@/application/context-service";
import { entryStatuses, entryTypes, privacyLevels } from "@/domain/context";
import { labelize } from "@/lib/format";
import { Button } from "@/components/ui/button";

import { createEntryAction } from "./actions";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="mt-1 text-sm text-danger">{errors[0]}</p>;
}

export function CaptureForm() {
  const [state, formAction, pending] = useActionState(createEntryAction, initialCaptureEntryState);

  return (
    <form action={formAction} className="grid gap-5">
      {state.status === "error" && (
        <div className="border-l-4 border-danger bg-red-50 px-4 py-3 text-sm text-red-900">
          {state.message ?? "The entry could not be saved."}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          Type
          <select
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            name="type"
            defaultValue="observation"
          >
            {entryTypes.map((type) => (
              <option key={type} value={type}>
                {labelize(type)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Status
          <select
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            name="status"
            defaultValue="active"
          >
            {entryStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Privacy
          <select
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            name="privacyLevel"
            defaultValue="private"
          >
            {privacyLevels.map((privacy) => (
              <option key={privacy} value={privacy}>
                {privacy}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Title
        <input
          className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          name="title"
          placeholder="A concise title"
        />
        <FieldError errors={state.fieldErrors?.title} />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Body
        <textarea
          className="min-h-44 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          name="body"
          placeholder="Capture the thought, observation, question, or decision."
          required
        />
        <FieldError errors={state.fieldErrors?.body} />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Summary
        <textarea
          className="min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          name="summary"
          placeholder="Optional compact summary for scanning and AI context."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Themes
          <input
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            name="themes"
            placeholder="AI, architecture, daily use"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Projects
          <input
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            name="projects"
            placeholder="personal-context-system"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          Occurred at
          <input
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            name="occurredAt"
            type="date"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Source
          <input
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            name="source"
            placeholder="self, Codex, article, conversation"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Confidence
          <input
            className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
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
          {pending ? "Saving..." : "Save entry"}
        </Button>
      </div>
    </form>
  );
}
