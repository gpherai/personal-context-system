"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/form-message";
import { referenceKinds } from "@/domain/context";
import { labelize } from "@/lib/format";

import { initialMutationState } from "@/application/action-states";

import {
  addAttachmentAction,
  addReferenceAction,
  createThreadWithEntryAction
} from "./actions";

export function ReferenceForm({ entryId }: { entryId: string }) {
  const actionWithEntry = addReferenceAction.bind(null, entryId);
  const [state, action, pending] = useActionState(actionWithEntry, initialMutationState);

  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-[160px_1fr]">
        <label className="grid gap-1.5 text-sm font-medium">
          Kind
          <select
            className="field-select"
            name="kind"
            defaultValue="url"
          >
            {referenceKinds.map((kind) => (
              <option key={kind} value={kind}>
                {labelize(kind)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Title
          <input
            className="field-input"
            name="title"
            placeholder="Reference title"
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">
        URL or identifier
        <input
          className="field-input"
          name="url"
          placeholder="https://, book ISBN, repo path, external record id"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Description
        <textarea
          className="field-textarea min-h-20"
          name="description"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Adding..." : "Add reference"}
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function AttachmentForm({ entryId }: { entryId: string }) {
  const actionWithEntry = addAttachmentAction.bind(null, entryId);
  const [state, action, pending] = useActionState(actionWithEntry, initialMutationState);

  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-1.5 text-sm font-medium">
        File path
        <input
          className="field-input"
          name="path"
          placeholder="data/attachments/example.pdf"
        />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-medium">
          Title
          <input
            className="field-input"
            name="title"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Media type
          <input
            className="field-input"
            name="mediaType"
            placeholder="application/pdf"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Size bytes
          <input
            className="field-input"
            inputMode="numeric"
            min="0"
            name="sizeBytes"
            type="number"
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">
        Description
        <textarea
          className="field-textarea min-h-20"
          name="description"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Adding..." : "Add attachment metadata"}
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function ThreadForm({ entryId }: { entryId: string }) {
  const actionWithEntry = createThreadWithEntryAction.bind(null, entryId);
  const [state, action, pending] = useActionState(actionWithEntry, initialMutationState);

  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-1.5 text-sm font-medium">
        Thread title
        <input
          className="field-input"
          name="title"
          placeholder="Continuing line of thought"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Description
        <textarea
          className="field-textarea min-h-20"
          name="description"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Creating..." : "Create thread from entry"}
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
