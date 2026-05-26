import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "blue" | "teal" | "amber" | "red" | "green";

const tones: Record<BadgeTone, string> = {
  neutral: "border-border bg-surface-muted text-muted-foreground",
  blue:    "border-primary/25 bg-primary/10 text-primary",
  teal:    "border-accent/25 bg-accent/10 text-accent",
  amber:   "border-caution/30 bg-caution/10 text-caution",
  red:     "border-danger/30 bg-danger/10 text-danger",
  green:   "border-success/30 bg-success/10 text-success",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium capitalize tracking-wide",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
