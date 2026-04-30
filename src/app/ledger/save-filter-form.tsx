"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { SavedFilterParams } from "@/domain/context";

import { createSavedFilterAction, initialMutationState } from "./actions";

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
    <form action={action} className="grid gap-3 border border-border bg-surface p-4">
      <div>
        <h2 className="text-sm font-semibold">Save current filter</h2>
        <p className="mt-1 text-sm text-muted-foreground">Persist this Ledger query for repeated review.</p>
      </div>
      {filterParamKeys.map((key) => (
        <input key={key} name={key} type="hidden" value={params[key] ?? ""} />
      ))}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="grid gap-2 text-sm font-medium">
          Name
          <input
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            name="name"
            placeholder="Open architecture questions"
            required
          />
        </label>
        <div className="flex items-end">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Saving..." : "Save filter"}
          </Button>
        </div>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        Description
        <input
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          name="description"
          placeholder="Optional note"
        />
      </label>
      {state.message && (
        <p className={state.status === "error" ? "text-sm text-danger" : "text-sm text-accent"}>{state.message}</p>
      )}
    </form>
  );
}
