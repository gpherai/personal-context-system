import Link from "next/link";
import type { ComponentProps } from "react";

import { buttonClassName, type ButtonSize, type ButtonVariant } from "./button";

// A Next.js Link styled exactly like <Button>, for navigations that should read
// as buttons (Cancel / Clear / Reset / Edit).
export function ButtonLink({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <Link className={buttonClassName(variant, size, className)} {...props} />;
}
