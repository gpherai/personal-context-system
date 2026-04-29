import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "blue" | "teal" | "amber" | "red";

const tones: Record<BadgeTone, string> = {
  neutral: "border-border bg-surface-muted text-muted-foreground",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  teal: "border-teal-200 bg-teal-50 text-teal-800",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  red: "border-red-200 bg-red-50 text-red-800"
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium capitalize",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
