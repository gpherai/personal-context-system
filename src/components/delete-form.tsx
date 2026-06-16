"use client";

import type { ReactNode } from "react";

export function DeleteForm({
  action,
  confirmMessage,
  className,
  children
}: {
  action: () => void | Promise<void>;
  confirmMessage: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
