"use client";

import { useActionState } from "react";

import { Button, Field, Panel, PanelTitle } from "@/components/ui";
import { FormMessage } from "@/components/form-message";
import type { SavedFilterParams } from "@/domain/context";

import { initialMutationState } from "@/application/action-states";

import { createSavedFilterAction } from "./actions";

const filterParamKeys: (keyof SavedFilterParams)[] = [
  "search",
  "type",
  "status",
  "privacyLevel",
  "themeSlug",
  "projectSlug",
  "questionId",
  "occurredFrom",
  "occurredTo"
];

export function SaveFilterForm({ params }: { params: SavedFilterParams }) {
  const [state, action, pending] = useActionState(createSavedFilterAction, initialMutationState);

  return (
    <Panel as="form" pad="sm" action={action} className="grid gap-3">
      <PanelTitle>Save current filter</PanelTitle>
      <p className="-mt-2 text-sm text-muted-foreground">Persist this Ledger query for repeated review.</p>
      {filterParamKeys.map((key) => (
        <input key={key} name={key} type="hidden" value={params[key] ?? ""} />
      ))}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field name="name" label="Name" required>
          {(p) => <input className="field-input" placeholder="Open architecture questions" {...p} />}
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Saving…" : "Save filter"}
          </Button>
        </div>
      </div>
      <Field name="description" label="Description">
        {(p) => <input className="field-input" placeholder="Optional note" {...p} />}
      </Field>
      <FormMessage state={state} />
    </Panel>
  );
}
