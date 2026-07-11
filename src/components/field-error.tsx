export function FieldError({ id, errors }: { id?: string; errors?: string[] }) {
  if (!errors?.length) return null;

  return (
    <div id={id} role="alert" aria-live="polite" className="mt-1 grid gap-0.5">
      {errors.map((error, i) => (
        <p key={i} className="text-xs text-danger">
          {error}
        </p>
      ))}
    </div>
  );
}
