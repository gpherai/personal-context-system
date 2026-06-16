"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { initialMutationState } from "@/application/action-states";

import { mergeThemeAction, updateThemeAction } from "./actions";

function Message({ state }: { state: typeof initialMutationState }) {
  if (!state.message) {
    return null;
  }

  return <p className={state.status === "error" ? "text-sm text-danger" : "text-sm text-accent"}>{state.message}</p>;
}

export function RenameThemeForm({
  themeId,
  name,
  description
}: {
  themeId: string;
  name: string;
  description?: string;
}) {
  const actionWithId = updateThemeAction.bind(null, themeId);
  const [state, action, pending] = useActionState(actionWithId, initialMutationState);

  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-1.5 text-sm font-medium">
        Naam
        <input className="field-input" name="name" defaultValue={name} required maxLength={160} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Beschrijving
        <textarea
          className="min-h-20 rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          name="description"
          defaultValue={description ?? ""}
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Opslaan..." : "Opslaan"}
        </Button>
        <Message state={state} />
      </div>
    </form>
  );
}

export function MergeThemeForm({
  themeId,
  otherThemes
}: {
  themeId: string;
  otherThemes: { id: string; name: string }[];
}) {
  const actionWithId = mergeThemeAction.bind(null, themeId);
  const [state, action, pending] = useActionState(actionWithId, initialMutationState);

  if (otherThemes.length === 0) {
    return <p className="text-sm text-muted-foreground">Geen andere thema&apos;s om mee samen te voegen.</p>;
  }

  return (
    <form
      action={action}
      className="grid gap-3"
      onSubmit={(e) => {
        if (!confirm("Dit thema wordt verwijderd en alle koppelingen verhuizen naar het doelthema. Doorgaan?")) {
          e.preventDefault();
        }
      }}
    >
      <label className="grid gap-1.5 text-sm font-medium">
        Samenvoegen in
        <select className="field-select" name="targetThemeId" required defaultValue="">
          <option value="" disabled>
            Kies een doelthema
          </option>
          {otherThemes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Samenvoegen..." : "Thema's samenvoegen"}
        </Button>
        <Message state={state} />
      </div>
    </form>
  );
}
