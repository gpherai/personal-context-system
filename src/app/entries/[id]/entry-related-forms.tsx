"use client";

import { useActionState } from "react";

import { RelationshipTargetSelect } from "@/components/relationship-target-select";
import { Button } from "@/components/ui/button";
import { referenceKinds, relationTypes } from "@/domain/context";
import { labelize } from "@/lib/format";
import type { RelationshipTarget } from "@/repositories/context-repository";

import { initialMutationState } from "@/application/action-states";

import {
  addAttachmentAction,
  addReferenceAction,
  createThreadWithEntryAction,
  linkFromEntryAction
} from "./actions";

function Message({ state }: { state: typeof initialMutationState }) {
  if (!state.message) {
    return null;
  }

  return <p className={state.status === "error" ? "text-sm text-danger" : "text-sm text-accent"}>{state.message}</p>;
}

export function RelationshipForm({ entryId, targets }: { entryId: string; targets: RelationshipTarget[] }) {
  const actionWithEntry = linkFromEntryAction.bind(null, entryId);
  const [state, action, pending] = useActionState(actionWithEntry, initialMutationState);

  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <RelationshipTargetSelect targets={targets} source={{ objectType: "entry", objectId: entryId }} />
        <label className="grid gap-1.5 text-sm font-medium">
          Relation
          <select
            className="field-select"
            name="relationType"
            defaultValue="relates_to"
          >
            {relationTypes.map((type) => (
              <option key={type} value={type}>
                {labelize(type)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">
        Note
        <input
          className="field-input"
          name="note"
          placeholder="Why these objects are connected"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Linking..." : "Create link"}
        </Button>
        <Message state={state} />
      </div>
    </form>
  );
}

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
          className="min-h-20 rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          name="description"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Adding..." : "Add reference"}
        </Button>
        <Message state={state} />
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
          className="min-h-20 rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          name="description"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Adding..." : "Add attachment metadata"}
        </Button>
        <Message state={state} />
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
          className="min-h-20 rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          name="description"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Creating..." : "Create thread from entry"}
        </Button>
        <Message state={state} />
      </div>
    </form>
  );
}
