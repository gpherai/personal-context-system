"use client";

import { Package } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { bundleRecordTypes, privacyLevels, sourceTypes } from "@/domain/context";
import { labelize } from "@/lib/format";

import { generateBundleAction, initialGenerateBundleState } from "./actions";

const defaultBundleSourceTypes = sourceTypes.filter((type) => type !== "conversation");

export function GenerateBundleForm() {
  const [state, action, pending] = useActionState(generateBundleAction, initialGenerateBundleState);

  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-1.5 text-sm font-medium">
        Privacy floor
        <select className="field-select" name="privacyFloor" defaultValue="shareable">
          {privacyLevels.map((level) => (
            <option key={level} value={level}>
              {labelize(level)}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="grid gap-1.5 text-sm font-medium">
        <legend>Record types</legend>
        <div className="flex flex-wrap gap-3 text-sm font-normal">
          {bundleRecordTypes.map((type) => (
            <label key={type} className="flex items-center gap-1.5">
              <input type="checkbox" name="recordTypes" value={type} defaultChecked />
              {labelize(type)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-1.5 text-sm font-medium">
        <legend>Source types</legend>
        <div className="flex flex-wrap gap-3 text-sm font-normal">
          {sourceTypes.map((type) => (
            <label key={type} className="flex items-center gap-1.5">
              <input
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

      <label className="grid gap-1.5 text-sm font-medium">
        Theme slugs
        <input className="field-input" name="themeSlugs" placeholder="theme-a, theme-b" />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Occurred from
          <input className="field-input" type="date" name="occurredFrom" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Occurred to
          <input className="field-input" type="date" name="occurredTo" />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-medium">
        IDs (one per line)
        <textarea className="field-textarea" name="ids" rows={3} placeholder="entry_abc123" />
      </label>

      <p className="text-xs leading-5 text-muted-foreground">
        Only records at or above this privacy floor, matching every filter above, are included. The bundle is
        deterministic and content-addressed with a SHA-256 hash.
      </p>
      <Button type="submit" disabled={pending}>
        <Package className="h-4 w-4" aria-hidden="true" />
        {pending ? "Generating…" : "Generate bundle"}
      </Button>

      {state.status === "error" && state.message && (
        <p role="alert" aria-live="polite" className="text-sm text-danger">
          {state.message}
        </p>
      )}

      {state.status === "success" && state.manifest && (
        <div role="status" aria-live="polite" className="grid gap-2 rounded-md border border-success/30 bg-success/8 p-3 text-sm">
          <p className="font-medium text-success">{state.message}</p>
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
        </div>
      )}
    </form>
  );
}
