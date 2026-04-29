import { CaptureForm } from "./capture-form";

export default function CapturePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="border-b border-border pb-5">
        <p className="text-sm font-medium text-primary">Capture</p>
        <h1 className="mt-1 text-3xl font-semibold">New context entry</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Create a durable entry and optionally attach it to themes or projects.
        </p>
      </header>
      <section className="mt-6 border border-border bg-surface p-5">
        <CaptureForm />
      </section>
    </div>
  );
}
