import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary: "border-primary bg-primary text-white hover:bg-primary-strong focus-visible:ring-primary/30",
  secondary: "border-border bg-surface text-foreground hover:border-muted hover:bg-surface-muted",
  ghost: "border-transparent bg-transparent text-muted-foreground hover:bg-surface-muted hover:text-foreground",
  danger: "border-danger bg-danger text-white hover:bg-danger-strong focus-visible:ring-danger/30"
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      type={type}
      {...props}
    />
  );
}
