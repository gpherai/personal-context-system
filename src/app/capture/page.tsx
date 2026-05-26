import { CaptureForm } from "./capture-form";

export default function CapturePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Capture</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">New context entry</h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Create a durable entry and optionally attach it to themes or projects.
        </p>
      </header>
      <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm">
        <CaptureForm />
      </section>
    </div>
  );
}
