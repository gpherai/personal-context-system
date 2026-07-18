"use client";

import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  // Drive the native <dialog> from the `open` prop. showModal() provides a focus
  // trap, top-layer rendering, an inert background, Esc handling, and restores
  // focus to the trigger on close — no manual a11y plumbing needed.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // Lock background scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClick={(e) => {
        // Backdrop click (the dialog element itself is the click target).
        if (e.target === dialogRef.current) onCancel();
      }}
      className="m-auto w-full max-w-sm rounded-lg border border-border bg-surface text-foreground shadow-lg backdrop:bg-foreground/40"
    >
      <div className="p-5">
        <h2 id={titleId} className="text-sm font-semibold text-foreground">
          {title}
        </h2>
        <p id={messageId} className="mt-2 text-sm leading-6 text-muted-foreground">
          {message}
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button type="button" variant="secondary" autoFocus={tone === "danger"} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={tone} autoFocus={tone !== "danger"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
