import { PageHeader, Panel } from "@/components/ui";

import { CaptureForm } from "./capture-form";

export default function CapturePage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <PageHeader
        eyebrow="Capture"
        title="New context entry"
        description="Create a durable entry and optionally attach it to themes or projects."
      />
      <Panel aria-label="Capture form">
        <CaptureForm />
      </Panel>
    </div>
  );
}
