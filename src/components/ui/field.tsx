import type { ReactNode } from "react";

import { FieldError } from "@/components/field-error";
import { cn } from "@/lib/cn";

/**
 * Label + control + hint + error, wired together.
 *
 * Every form in the app hand-rolled this, which is why hints and errors ended
 * up in different places per form and were not always announced. Here the
 * control gets `aria-describedby` pointing at whichever of hint/error exists.
 *
 * The control is a render prop rather than children so it can receive the ids:
 *
 *   <Field name="title" label="Title" error={errors.title}>
 *     {(props) => <input className="field-input" {...props} />}
 *   </Field>
 */
export function Field({
  name,
  label,
  hint,
  errors,
  required,
  className,
  children,
}: {
  /** Used for id, htmlFor and the control's name attribute. */
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  errors?: string[];
  required?: boolean;
  className?: string;
  children: (props: {
    id: string;
    name: string;
    required?: boolean;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }) => ReactNode;
}) {
  const id = `field-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = errors?.length ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label className="text-sm font-medium text-foreground" htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-danger">
            *
          </span>
        ) : null}
      </label>

      {children({
        id,
        name,
        required,
        "aria-describedby": describedBy,
        "aria-invalid": errors?.length ? true : undefined,
      })}

      {hint ? (
        <p id={hintId} className="text-xs leading-5 text-muted-foreground">
          {hint}
        </p>
      ) : null}

      <FieldError id={errorId} errors={errors} />
    </div>
  );
}
