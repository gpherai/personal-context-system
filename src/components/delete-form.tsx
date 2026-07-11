"use client";

import { useActionState, useRef, useState } from "react";

import { initialMutationState, type MutationState } from "@/application/action-states";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cn } from "@/lib/cn";

// Shared danger action-button styling. `fullWidth` stretches it (stacked layouts);
// the default is inline for header rows.
export const dangerActionClassName =
  "inline-flex h-10 items-center justify-center rounded-lg border border-danger/30 bg-danger/8 px-4 text-sm font-medium text-danger transition-colors duration-150 hover:bg-danger/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30 cursor-pointer";

export function DeleteForm({
  action,
  title,
  message,
  triggerLabel = "Delete",
  confirmLabel = "Delete",
  fullWidth = false,
  triggerClassName
}: {
  action: (state: MutationState, formData: FormData) => Promise<MutationState>;
  title: string;
  message: string;
  triggerLabel?: string;
  confirmLabel?: string;
  fullWidth?: boolean;
  triggerClassName?: string;
}) {
  const [state, formAction] = useActionState(action, initialMutationState);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className={cn("grid gap-1.5", fullWidth && "w-full")}>
      <form ref={formRef} action={formAction}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(dangerActionClassName, fullWidth && "w-full", triggerClassName)}
        >
          {triggerLabel}
        </button>
      </form>

      <ConfirmDialog
        open={open}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        tone="danger"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />

      {state.status === "error" && state.message && (
        <p role="alert" aria-live="polite" className="text-xs text-danger">
          {state.message}
        </p>
      )}
    </div>
  );
}
