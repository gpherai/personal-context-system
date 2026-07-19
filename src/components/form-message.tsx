import type { MutationState } from "@/application/action-states";
import { Alert } from "@/components/ui";

/**
 * Form-level result of a server action. Always an <Alert>, so a failed save
 * looks the same in every form — before this, source-form used a left-rule bar
 * and capture/edit-entry used a rounded box.
 */
export function FormMessage({ state }: { state: MutationState }) {
  if (!state.message) return null;

  return (
    <Alert live tone={state.status === "error" ? "danger" : "success"}>
      {state.message}
    </Alert>
  );
}
