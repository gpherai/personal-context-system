"use client";

import { useActionState, useState } from "react";

import { initialMutationState } from "@/application/action-states";
import { FieldError } from "@/components/field-error";
import { TaxonomyPicker } from "@/components/taxonomy-picker";
import { Button } from "@/components/ui/button";
import { privacyLevels, sourceTypes, type SourceType, type RecordStatus, type PrivacyLevel, type SourceMetadata } from "@/domain/context";
import { sourceTypeDetails } from "@/domain/taxonomy";
import { labelize } from "@/lib/format";
import type { MutationState } from "@/application/action-states";
import type { ReferenceRecord } from "@/repositories/context-repository";

interface Theme {
  id: string;
  name: string;
  slug: string;
}

interface SourceFormInitial {
  type?: SourceType;
  status?: RecordStatus;
  privacyLevel?: PrivacyLevel;
  title?: string;
  description?: string;
  body?: string;
  metadata?: SourceMetadata;
  themes?: { id: string }[];
  references?: ReferenceRecord[];
}

interface SourceFormProps {
  action: (state: MutationState, formData: FormData) => Promise<MutationState>;
  themes: Theme[];
  initial?: SourceFormInitial;
  isEdit?: boolean;
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {children}
      <FieldError errors={error} />
    </label>
  );
}


function MetadataFields({
  type,
  initial,
  errors
}: {
  type: string;
  initial?: Record<string, unknown>;
  errors?: Record<string, string[] | undefined>;
}) {
  const m = (initial ?? {}) as Record<string, unknown>;
  const str = (k: string) => (typeof m[k] === "string" ? String(m[k]) : "");
  const num = (k: string) => (typeof m[k] === "number" ? String(m[k]) : "");
  const lines = (k: string) => (Array.isArray(m[k]) ? (m[k] as string[]).join("\n") : "");
  const csv = (k: string) => (Array.isArray(m[k]) ? (m[k] as string[]).join(", ") : "");
  const err = (k: string) => errors?.[k];

  switch (type) {
    case "video":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Channel" error={err("channel")}><input className="field-input" name="channel" defaultValue={str("channel")} /></Field>
          <Field label="Duration (s)" error={err("duration")}><input className="field-input" name="duration" defaultValue={num("duration")} type="number" min="0" /></Field>
          <Field label="Language" error={err("language")}><input className="field-input" name="language" defaultValue={str("language")} /></Field>
        </div>
      );
    case "book":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Authors (comma-separated)" error={err("authors")}><input className="field-input" name="authors" defaultValue={csv("authors")} /></Field>
            <Field label="ISBN" error={err("isbn")}><input className="field-input" name="isbn" defaultValue={str("isbn")} /></Field>
            <Field label="Year" error={err("year")}><input className="field-input" name="year" defaultValue={num("year")} type="number" /></Field>
            <Field label="Publisher" error={err("publisher")}><input className="field-input" name="publisher" defaultValue={str("publisher")} /></Field>
            <Field label="Language" error={err("language")}><input className="field-input" name="language" defaultValue={str("language")} /></Field>
          </div>
          <Field label="Chapters (one per line)" error={err("chapters")}>
            <textarea className="field-textarea" name="chapters" defaultValue={lines("chapters")} placeholder="Chapter 1&#10;Chapter 2" />
          </Field>
        </div>
      );
    case "post":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Author" error={err("author")}><input className="field-input" name="author" defaultValue={str("author")} /></Field>
          <Field label="Published" error={err("publishedAt")}><input className="field-input" name="publishedAt" defaultValue={str("publishedAt")} /></Field>
        </div>
      );
    case "image":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Alt text" error={err("alt")}><input className="field-input" name="alt" defaultValue={str("alt")} /></Field>
          <Field label="Photographer" error={err("photographer")}><input className="field-input" name="photographer" defaultValue={str("photographer")} /></Field>
        </div>
      );
    default:
      return null;
  }
}

interface NewRef { title: string; url: string }

function ReferencesSection({ existingReferences }: { existingReferences: ReferenceRecord[] }) {
  const [existingIds, setExistingIds] = useState<string[]>(existingReferences.map((r) => r.id));
  const [existing, setExisting] = useState<ReferenceRecord[]>(existingReferences);
  const [newRefs, setNewRefs] = useState<NewRef[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");

  function addUrl() {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) return;
    let hostname = trimmedUrl;
    try { hostname = new URL(trimmedUrl).hostname; } catch { /* keep as-is */ }
    setNewRefs((prev) => [...prev, { title: titleInput.trim() || hostname, url: trimmedUrl }]);
    setUrlInput("");
    setTitleInput("");
  }

  function removeExisting(id: string) {
    setExisting((prev) => prev.filter((r) => r.id !== id));
    setExistingIds((prev) => prev.filter((i) => i !== id));
  }

  function removeNew(url: string) {
    setNewRefs((prev) => prev.filter((r) => r.url !== url));
  }

  return (
    <div className="grid gap-3">
      {existingIds.map((id) => (
        <input key={id} type="hidden" name="referenceId" value={id} />
      ))}
      {newRefs.map((r) => (
        <span key={r.url}>
          <input type="hidden" name="newRefTitle" value={r.title} />
          <input type="hidden" name="newRefUrl" value={r.url} />
        </span>
      ))}

      {(existing.length > 0 || newRefs.length > 0) && (
        <div className="grid gap-2">
          {existing.map((ref) => (
            <div key={ref.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium truncate">{ref.title}</p>
                {ref.url && <p className="truncate text-xs text-muted-foreground">{ref.url}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeExisting(ref.id)}
                className="inline-flex h-11 shrink-0 items-center rounded-md px-3 text-xs font-medium text-danger transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
              >
                Remove
              </button>
            </div>
          ))}
          {newRefs.map((ref) => (
            <div key={ref.url} className="flex items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium truncate">{ref.title}</p>
                <p className="truncate text-xs text-muted-foreground">{ref.url}</p>
              </div>
              <button
                type="button"
                onClick={() => removeNew(ref.url)}
                className="inline-flex h-11 shrink-0 items-center rounded-md px-3 text-xs font-medium text-danger transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
        <input
          className="field-input"
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://…"
          type="url"
          value={urlInput}
        />
        <input
          className="field-input"
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder="Title (optional)"
          type="text"
          value={titleInput}
        />
      </div>
      <button
        type="button"
        onClick={addUrl}
        className="inline-flex h-9 w-fit items-center rounded-md border border-border bg-surface px-3 text-sm font-medium transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        Add URL
      </button>
    </div>
  );
}

export function SourceForm({ action, themes, initial, isEdit = false }: SourceFormProps) {
  const [state, formAction, pending] = useActionState(action, initialMutationState);
  const [selectedType, setSelectedType] = useState<string>(initial?.type ?? "");

  const selectedThemeIds = initial?.themes?.map((t) => t.id) ?? [];
  const initialMeta = initial?.metadata as Record<string, unknown> | undefined;
  const existingReferences = initial?.references ?? [];
  const isReadOnlyConversation = isEdit && initial?.type === "conversation";

  return (
    <form action={formAction} className="grid gap-5">
      {state.status === "error" && (
        <div role="alert" aria-live="polite" className="border-l-4 border-danger bg-danger/8 px-4 py-3 text-sm text-danger">
          {state.message ?? "The source could not be saved."}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Type" error={state.fieldErrors?.type}>
          {isEdit ? (
            <>
              <input type="hidden" name="type" value={initial?.type ?? ""} />
              <div className="field-input flex items-center bg-surface-muted text-muted-foreground">
                {initial?.type ? sourceTypeDetails[initial.type as keyof typeof sourceTypeDetails]?.label : "—"}
              </div>
            </>
          ) : (
            <select
              className="field-select"
              name="type"
              defaultValue={initial?.type ?? ""}
              onChange={(e) => setSelectedType(e.target.value)}
              required
            >
              <option value="">Choose a type…</option>
              {sourceTypes
                .filter((type) => type !== "conversation")
                .map((type) => (
                  <option key={type} value={type}>
                    {sourceTypeDetails[type].label}
                  </option>
                ))}
            </select>
          )}
        </Field>

        <Field label="Status" error={state.fieldErrors?.status}>
          <select className="field-select" name="status" defaultValue={initial?.status ?? "active"}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </Field>

        <Field label="Privacy" error={state.fieldErrors?.privacyLevel}>
          <select className="field-select" name="privacyLevel" defaultValue={initial?.privacyLevel ?? "private"}>
            {privacyLevels.map((level) => (
              <option key={level} value={level}>
                {labelize(level)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Title" error={state.fieldErrors?.title}>
        <input
          className={isReadOnlyConversation ? "field-input bg-surface-muted text-muted-foreground" : "field-input"}
          name="title"
          defaultValue={initial?.title ?? ""}
          placeholder="Name of the source"
          readOnly={isReadOnlyConversation}
          maxLength={320}
          required
        />
      </Field>

      <Field label="Description">
        <textarea
          className={
            isReadOnlyConversation
              ? "field-textarea min-h-24 bg-surface-muted text-muted-foreground"
              : "field-textarea min-h-24"
          }
          name="description"
          defaultValue={initial?.description ?? ""}
          placeholder="Optional short description"
          readOnly={isReadOnlyConversation}
          maxLength={4000}
        />
      </Field>

      <Field label="Body / full text">
        <textarea
          className={
            isReadOnlyConversation
              ? "field-textarea min-h-32 bg-surface-muted text-muted-foreground"
              : "field-textarea min-h-32"
          }
          name="body"
          defaultValue={initial?.body ?? ""}
          placeholder="Full text, article body, or extended notes…"
          readOnly={isReadOnlyConversation}
          maxLength={200000}
        />
      </Field>

      {!isReadOnlyConversation && (selectedType || isEdit) && (
        <fieldset className="grid gap-4 rounded-md border border-border p-4">
          <legend className="px-1 text-xs font-medium text-muted-foreground">
            {selectedType ? sourceTypeDetails[selectedType as keyof typeof sourceTypeDetails]?.label ?? selectedType : ""} details
          </legend>
          <MetadataFields
            type={isEdit ? (initial?.type ?? "") : selectedType}
            initial={initialMeta}
            errors={state.fieldErrors}
          />
        </fieldset>
      )}

      <div className="grid gap-2">
        <span className="text-sm font-medium">Themes</span>
        <TaxonomyPicker themes={themes} selectedIds={selectedThemeIds} />
      </div>

      <fieldset className="grid gap-3 rounded-md border border-border p-4">
        <legend className="px-1 text-xs font-medium text-muted-foreground">References (URLs)</legend>
        <ReferencesSection existingReferences={existingReferences} />
      </fieldset>

      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create source"}
        </Button>
      </div>
    </form>
  );
}
