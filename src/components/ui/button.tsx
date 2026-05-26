import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const variants: Record<ButtonVariant, string> = {
  primary:   "border-transparent bg-primary text-white shadow-sm hover:bg-primary-strong focus-visible:ring-primary/30",
  secondary: "border-border bg-surface text-foreground shadow-sm hover:bg-surface-muted focus-visible:ring-primary/20",
  ghost:     "border-transparent bg-transparent text-muted-foreground hover:bg-surface-muted hover:text-foreground focus-visible:ring-primary/20",
  danger:    "border-transparent bg-danger text-white shadow-sm hover:bg-danger-strong focus-visible:ring-danger/30",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-xs",
  md: "h-10 gap-2 rounded-lg px-4 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center border font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      type={type}
      {...props}
    />
  );
}
