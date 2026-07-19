"use client";

import { Package } from "lucide-react";
import { useActionState } from "react";

import { Alert, Button, Field } from "@/components/ui";
import { bundleRecordTypes, privacyLevels, sourceTypes } from "@/domain/context";
import { labelize } from "@/lib/format";

import { generateBundleAction, initialGenerateBundleState } from "./actions";

const defaultBundleSourceTypes = sourceTypes.filter((type) => type !== "conversation");

export function GenerateBundleForm() {
  const [state, action, pending] = useActionState(generateBundleAction, initialGenerateBundleState);

  return (
    <form action={action} className="grid gap-3">
      <Field name="privacyFloor" label="Privacy floor">
        {(p) => (
          <select className="field-select" defaultValue="shareable" {...p}>
            {privacyLevels.map((level) => (
              <option key={level} value={level}>
                {labelize(level)}
              </option>
            ))}
          </select>
        )}
      </Field>

      <fieldset className="grid gap-1.5 text-sm font-medium">
        <legend>Record types</legend>
        <div className="flex flex-wrap gap-3 text-sm font-normal">
          {bundleRecordTypes.map((type) => (
            <label key={type} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input className="h-5 w-5 cursor-pointer accent-primary" type="checkbox" name="recordTypes" value={type} defaultChecked />
              {labelize(type)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-1.5 text-sm font-medium">
        <legend>Source types</legend>
        <div className="flex flex-wrap gap-3 text-sm font-normal">
          {sourceTypes.map((type) => (
            <label key={type} className="flex min-h-11 cursor-pointer items-center gap-2">
              <input
                className="h-5 w-5 cursor-pointer accent-primary"
                type="checkbox"
                name="sourceTypes"
                value={type}
                defaultChecked={(defaultBundleSourceTypes as readonly string[]).includes(type)}
              />
              {labelize(type)}
            </label>
          ))}
        </div>
      </fieldset>

      <Field name="themeSlugs" label="Theme slugs">
        {(p) => <input className="field-input" placeholder="theme-a, theme-b" {...p} />}
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="occurredFrom" label="Occurred from">
          {(p) => <input className="field-input" type="date" {...p} />}
        </Field>
        <Field name="occurredTo" label="Occurred to">
          {(p) => <input className="field-input" type="date" {...p} />}
        </Field>
      </div>

      <Field name="ids" label="IDs" hint="One per line.">
        {(p) => <textarea className="field-textarea" rows={3} placeholder="entry_abc123" {...p} />}
      </Field>

      <p className="text-xs leading-5 text-muted-foreground">
        Only records at or above this privacy floor, matching every filter above, are included. The bundle is
        deterministic and content-addressed with a SHA-256 hash.
      </p>
      <Button type="submit" disabled={pending}>
        <Package className="h-4 w-4" aria-hidden="true" />
        {pending ? "Generating…" : "Generate bundle"}
      </Button>

      {state.status === "error" && state.message && (
        <Alert live tone="danger">{state.message}</Alert>
      )}

      {state.status === "success" && state.manifest && (
        <Alert live tone="success" title={state.message}>
          <dl className="grid gap-1 text-xs text-muted-foreground">
            <div className="flex justify-between gap-3">
              <dt>Files</dt>
              <dd className="tabular-nums text-foreground">{state.manifest.fileCount}</dd>
            </div>
            <div className="grid gap-0.5">
              <dt>Content hash (SHA-256)</dt>
              <dd className="break-all font-mono text-[11px] text-foreground">{state.manifest.contentHash}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Generated at</dt>
              <dd className="text-foreground">{state.manifest.generatedAt}</dd>
            </div>
          </dl>
        </Alert>
      )}
    </form>
  );
}
