import type { MutationState } from "@/application/action-states";

export function FormMessage({ state }: { state: MutationState }) {
  if (!state.message) return null;

  return (
    <p
      role="status"
      aria-live="polite"
      className={state.status === "error" ? "text-sm text-danger" : "text-sm text-accent"}
    >
      {state.message}
    </p>
  );
}
