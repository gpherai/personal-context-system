"use client";

import { useActionState, useState } from "react";

import { initialMutationState } from "@/application/action-states";
import { TaxonomyPicker } from "@/components/taxonomy-picker";
import { Alert, Button, Field, Panel } from "@/components/ui";
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
          <Field name="channel" label="Channel" errors={err("channel")}>
            {(p) => <input className="field-input" defaultValue={str("channel")} {...p} />}
          </Field>
          <Field name="duration" label="Duration (s)" errors={err("duration")}>
            {(p) => <input className="field-input" defaultValue={num("duration")} type="number" min="0" {...p} />}
          </Field>
          <Field name="language" label="Language" errors={err("language")}>
            {(p) => <input className="field-input" defaultValue={str("language")} {...p} />}
          </Field>
        </div>
      );
    case "book":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="authors" label="Authors" hint="Comma-separated." errors={err("authors")}>
              {(p) => <input className="field-input" defaultValue={csv("authors")} {...p} />}
            </Field>
            <Field name="isbn" label="ISBN" errors={err("isbn")}>
              {(p) => <input className="field-input" defaultValue={str("isbn")} {...p} />}
            </Field>
            <Field name="year" label="Year" errors={err("year")}>
              {(p) => <input className="field-input" defaultValue={num("year")} type="number" {...p} />}
            </Field>
            <Field name="publisher" label="Publisher" errors={err("publisher")}>
              {(p) => <input className="field-input" defaultValue={str("publisher")} {...p} />}
            </Field>
            <Field name="language" label="Language" errors={err("language")}>
              {(p) => <input className="field-input" defaultValue={str("language")} {...p} />}
            </Field>
          </div>
          <Field name="chapters" label="Chapters" hint="One per line." errors={err("chapters")}>
            {(p) => (
              <textarea
                className="field-textarea"
                defaultValue={lines("chapters")}
                placeholder="Chapter 1&#10;Chapter 2"
                {...p}
              />
            )}
          </Field>
        </div>
      );
    case "post":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="author" label="Author" errors={err("author")}>
            {(p) => <input className="field-input" defaultValue={str("author")} {...p} />}
          </Field>
          <Field name="publishedAt" label="Published" errors={err("publishedAt")}>
            {(p) => <input className="field-input" defaultValue={str("publishedAt")} {...p} />}
          </Field>
        </div>
      );
    case "image":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="alt" label="Alt text" errors={err("alt")}>
            {(p) => <input className="field-input" defaultValue={str("alt")} {...p} />}
          </Field>
          <Field name="photographer" label="Photographer" errors={err("photographer")}>
            {(p) => <input className="field-input" defaultValue={str("photographer")} {...p} />}
          </Field>
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
            <Panel
              key={ref.id}
              as="div"
              pad="none"
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{ref.title}</p>
                {ref.url && <p className="truncate font-mono text-xs text-muted-foreground">{ref.url}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeExisting(ref.id)}
                className="inline-flex h-11 shrink-0 cursor-pointer items-center rounded-md px-3 text-xs font-medium text-danger transition-colors duration-150 hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
              >
                Remove
              </button>
            </Panel>
          ))}
          {newRefs.map((ref) => (
            <div
              key={ref.url}
              className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{ref.title}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{ref.url}</p>
              </div>
              <button
                type="button"
                onClick={() => removeNew(ref.url)}
                className="inline-flex h-11 shrink-0 cursor-pointer items-center rounded-md px-3 text-xs font-medium text-danger transition-colors duration-150 hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
        <input
          aria-label="Reference URL"
          className="field-input"
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://…"
          type="url"
          value={urlInput}
        />
        <input
          aria-label="Reference title"
          className="field-input"
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder="Title (optional)"
          type="text"
          value={titleInput}
        />
      </div>
      <Button type="button" variant="secondary" size="sm" className="w-fit" onClick={addUrl}>
        Add URL
      </Button>
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
  const readOnlyClassName = isReadOnlyConversation ? " bg-surface-muted text-muted-foreground" : "";

  return (
    <form action={formAction} className="grid gap-4">
      {state.status === "error" && (
        <Alert live tone="danger">{state.message ?? "The source could not be saved."}</Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="type" label="Type" errors={state.fieldErrors?.type}>
          {(p) =>
            isEdit ? (
              <>
                <input type="hidden" name="type" value={initial?.type ?? ""} />
                <div id={p.id} className="field-input flex items-center bg-surface-muted text-muted-foreground">
                  {initial?.type ? sourceTypeDetails[initial.type as keyof typeof sourceTypeDetails]?.label : "—"}
                </div>
              </>
            ) : (
              <select
                className="field-select"
                defaultValue={initial?.type ?? ""}
                onChange={(e) => setSelectedType(e.target.value)}
                required
                {...p}
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
            )
          }
        </Field>

        <Field name="status" label="Status" errors={state.fieldErrors?.status}>
          {(p) => (
            <select className="field-select" defaultValue={initial?.status ?? "active"} {...p}>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          )}
        </Field>

        <Field name="privacyLevel" label="Privacy" errors={state.fieldErrors?.privacyLevel}>
          {(p) => (
            <select className="field-select" defaultValue={initial?.privacyLevel ?? "private"} {...p}>
              {privacyLevels.map((level) => (
                <option key={level} value={level}>
                  {labelize(level)}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field name="title" label="Title" required errors={state.fieldErrors?.title}>
        {(p) => (
          <input
            className={`field-input${readOnlyClassName}`}
            defaultValue={initial?.title ?? ""}
            placeholder="Name of the source"
            readOnly={isReadOnlyConversation}
            maxLength={320}
            {...p}
          />
        )}
      </Field>

      <Field name="description" label="Description">
        {(p) => (
          <textarea
            className={`field-textarea min-h-24${readOnlyClassName}`}
            defaultValue={initial?.description ?? ""}
            placeholder="Optional short description"
            readOnly={isReadOnlyConversation}
            maxLength={4000}
            {...p}
          />
        )}
      </Field>

      <Field name="body" label="Body / full text">
        {(p) => (
          <textarea
            className={`field-textarea min-h-32${readOnlyClassName}`}
            defaultValue={initial?.body ?? ""}
            placeholder="Full text, article body, or extended notes…"
            readOnly={isReadOnlyConversation}
            maxLength={200000}
            {...p}
          />
        )}
      </Field>

      {!isReadOnlyConversation && (selectedType || isEdit) && (
        <fieldset className="grid gap-4 rounded-lg border border-border p-4">
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

      <fieldset className="grid gap-3 rounded-lg border border-border p-4">
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
