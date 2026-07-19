import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type AlertTone = "info" | "success" | "caution" | "danger";

/**
 * One status banner. Replaces two competing error designs — a rounded box in
 * capture/edit-entry versus a left-rule bar in source-form — plus the ad-hoc
 * caution panel in setup-notice.
 *
 * Colour is never the only signal: every tone also carries its own icon.
 */
const tones: Record<AlertTone, { className: string; Icon: typeof Info }> = {
  info:    { className: "border-primary/25 bg-primary/8 text-primary",   Icon: Info },
  success: { className: "border-success/30 bg-success/8 text-success",   Icon: CheckCircle2 },
  caution: { className: "border-caution/30 bg-caution/8 text-caution",   Icon: AlertTriangle },
  danger:  { className: "border-danger/30 bg-danger/8 text-danger",      Icon: XCircle },
};

export function Alert({
  tone = "info",
  title,
  children,
  /** Set for messages that appear after a user action, so screen readers announce them. */
  live = false,
  className,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  live?: boolean;
  className?: string;
}) {
  const { className: toneClassName, Icon } = tones[tone];

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      aria-live={live ? "polite" : undefined}
      className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", toneClassName, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 leading-relaxed">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && "mt-1")}>{children}</div> : null}
      </div>
    </div>
  );
}
