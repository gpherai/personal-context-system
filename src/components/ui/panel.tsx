import type { ElementType, FormHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type PanelTone = "default" | "muted" | "outline" | "dashed";
export type PanelPad = "none" | "sm" | "md" | "lg";

/**
 * The one surface primitive. Before this there were 73 card instances in 13
 * spellings; the two that carried real meaning were "p-5 card" and "p-4 card".
 * Those are `pad="md"` and `pad="sm"` here — the rest were drift.
 *
 * Tones stay neutral on purpose: status colour belongs to <Alert>, not to
 * every container that happens to hold a warning.
 */
const tones: Record<PanelTone, string> = {
  default: "border-border bg-surface shadow-sm",
  muted:   "border-border bg-surface-muted",
  outline: "border-border bg-transparent",
  dashed:  "border-dashed border-border bg-transparent",
};

const pads: Record<PanelPad, string> = {
  none: "",
  sm:   "p-4",
  md:   "p-5",
  lg:   "p-8",
};

export function Panel({
  as: Tag = "section",
  tone = "default",
  pad = "md",
  className,
  ...props
}: HTMLAttributes<HTMLElement> &
  // Filter bars are panels that happen to be forms, so `as="form"` needs the
  // form-only attributes to survive typechecking.
  Pick<FormHTMLAttributes<HTMLFormElement>, "action" | "method"> & {
    as?: ElementType;
    tone?: PanelTone;
    pad?: PanelPad;
  }) {
  return (
    <Tag className={cn("rounded-lg border", tones[tone], pads[pad], className)} {...props} />
  );
}

/**
 * Small-caps section title inside a panel, with an optional leading icon and a
 * trailing slot for a link or count.
 */
export function PanelTitle({
  icon,
  children,
  action,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {children}
      </h2>
      {action}
    </div>
  );
}
