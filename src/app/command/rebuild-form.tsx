"use client";

import { RefreshCw } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { initialRebuildMirrorState, rebuildMirrorAction } from "./actions";

export function RebuildMirrorForm() {
  const [state, action, pending] = useActionState(rebuildMirrorAction, initialRebuildMirrorState);

  return (
    <form action={action} className="grid gap-3">
      <Button type="submit" disabled={pending}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {pending ? "Rebuilding..." : "Rebuild context mirror"}
      </Button>
      {state.message && (
        <p className={state.status === "error" ? "text-sm text-danger" : "text-sm text-accent"}>{state.message}</p>
      )}
    </form>
  );
}
