"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { objectTypes, referenceKinds, relationTypes } from "@/domain/context";
import { labelize } from "@/lib/format";

import {
  addAttachmentAction,
  addReferenceAction,
  createThreadWithEntryAction,
  initialMutationState,
  linkFromEntryAction
} from "./actions";

function Message({ state }: { state: typeof initialMutationState }) {
  if (!state.message) {
    return null;
  }

  return <p className={state.status === "error" ? "text-sm text-danger" : "text-sm text-accent"}>{state.message}</p>;
}

export function RelationshipForm({ entryId }: { entryId: string }) {
  const actionWithEntry = linkFromEntryAction.bind(null, entryId);
  const [state, action, pending] = useActionState(actionWithEntry, initialMutationState);

  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-[150px_1fr_180px]">
        <label className="grid gap-2 text-sm font-medium">
          Target type
          <select
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            name="toType"
            defaultValue="entry"
          >
            {objectTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Target id
          <input
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            name="toId"
            placeholder="entry, question, project, theme, thread, reference, attachment id"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Relation
          <select
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
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
      <label className="grid gap-2 text-sm font-medium">
        Note
        <input
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
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
        <label className="grid gap-2 text-sm font-medium">
          Kind
          <select
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
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
        <label className="grid gap-2 text-sm font-medium">
          Title
          <input
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            name="title"
            placeholder="Reference title"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        URL or identifier
        <input
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          name="url"
          placeholder="https://, book ISBN, repo path, external record id"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Description
        <textarea
          className="min-h-20 rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
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
      <label className="grid gap-2 text-sm font-medium">
        File path
        <input
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          name="path"
          placeholder="data/attachments/example.pdf"
        />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          Title
          <input
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            name="title"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Media type
          <input
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            name="mediaType"
            placeholder="application/pdf"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Size bytes
          <input
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            inputMode="numeric"
            min="0"
            name="sizeBytes"
            type="number"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium">
        Description
        <textarea
          className="min-h-20 rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
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
      <label className="grid gap-2 text-sm font-medium">
        Thread title
        <input
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          name="title"
          placeholder="Continuing line of thought"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Description
        <textarea
          className="min-h-20 rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
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
