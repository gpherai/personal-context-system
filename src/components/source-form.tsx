"use client";

import { useActionState, useState } from "react";

import { initialMutationState } from "@/application/action-states";
import { TaxonomyPicker } from "@/components/taxonomy-picker";
import { Button } from "@/components/ui/button";
import { sourceTypes, type SourceType, type RecordStatus, type SourceMetadata } from "@/domain/context";
import { sourceTypeDetails } from "@/domain/taxonomy";
import type { MutationState } from "@/application/action-states";

interface Theme {
  id: string;
  name: string;
  slug: string;
}

interface SourceFormInitial {
  type?: SourceType;
  status?: RecordStatus;
  title?: string;
  description?: string;
  metadata?: SourceMetadata;
  themes?: { id: string }[];
}

interface SourceFormProps {
  action: (state: MutationState, formData: FormData) => Promise<MutationState>;
  themes: Theme[];
  initial?: SourceFormInitial;
  isEdit?: boolean;
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-sm text-danger">{errors[0]}</p>;
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

function inputCls() {
  return "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";
}

function areaCls() {
  return "min-h-20 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";
}

function MetadataFields({ type, initial, errors }: { type: string; initial?: Record<string, unknown>; errors?: Record<string, string[] | undefined> }) {
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
          <Field label="URL" error={err("url")}><input className={inputCls()} name="url" defaultValue={str("url")} type="url" /></Field>
          <Field label="Channel" error={err("channel")}><input className={inputCls()} name="channel" defaultValue={str("channel")} /></Field>
          <Field label="Duration (s)" error={err("duration")}><input className={inputCls()} name="duration" defaultValue={num("duration")} type="number" min="0" /></Field>
          <Field label="Language" error={err("language")}><input className={inputCls()} name="language" defaultValue={str("language")} /></Field>
        </div>
      );
    case "book":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Authors (comma-separated)" error={err("authors")}><input className={inputCls()} name="authors" defaultValue={csv("authors")} /></Field>
            <Field label="ISBN" error={err("isbn")}><input className={inputCls()} name="isbn" defaultValue={str("isbn")} /></Field>
            <Field label="Year" error={err("year")}><input className={inputCls()} name="year" defaultValue={num("year")} type="number" /></Field>
            <Field label="Publisher" error={err("publisher")}><input className={inputCls()} name="publisher" defaultValue={str("publisher")} /></Field>
            <Field label="Language" error={err("language")}><input className={inputCls()} name="language" defaultValue={str("language")} /></Field>
          </div>
          <Field label="Chapters (one per line)" error={err("chapters")}>
            <textarea className={areaCls()} name="chapters" defaultValue={lines("chapters")} placeholder="Chapter 1&#10;Chapter 2" />
          </Field>
        </div>
      );
    case "post":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL" error={err("url")}><input className={inputCls()} name="url" defaultValue={str("url")} type="url" /></Field>
          <Field label="Author" error={err("author")}><input className={inputCls()} name="author" defaultValue={str("author")} /></Field>
          <Field label="Published" error={err("publishedAt")}><input className={inputCls()} name="publishedAt" defaultValue={str("publishedAt")} /></Field>
        </div>
      );
    case "image":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL" error={err("url")}><input className={inputCls()} name="url" defaultValue={str("url")} type="url" /></Field>
          <Field label="Alt text" error={err("alt")}><input className={inputCls()} name="alt" defaultValue={str("alt")} /></Field>
          <Field label="Photographer" error={err("photographer")}><input className={inputCls()} name="photographer" defaultValue={str("photographer")} /></Field>
        </div>
      );
    case "sadhana":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tradition" error={err("tradition")}><input className={inputCls()} name="tradition" defaultValue={str("tradition")} /></Field>
            <Field label="Deity" error={err("deity")}><input className={inputCls()} name="deity" defaultValue={str("deity")} /></Field>
            <Field label="Language" error={err("language")}><input className={inputCls()} name="language" defaultValue={str("language")} /></Field>
            <Field label="Format" error={err("format")}>
              <select className={inputCls()} name="format" defaultValue={str("format")}>
                <option value="">—</option>
                <option value="text">Text</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </select>
            </Field>
          </div>
          <Field label="Steps (one per line)" error={err("steps")}>
            <textarea className={areaCls()} name="steps" defaultValue={lines("steps")} placeholder="Step 1&#10;Step 2" />
          </Field>
          <Field label="Mantras (one per line)" error={err("mantras")}>
            <textarea className={areaCls()} name="mantras" defaultValue={lines("mantras")} placeholder="Om Namah Shivaya&#10;Om Gam Ganapataye Namah" />
          </Field>
        </div>
      );
    case "upadesha":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Teacher" error={err("teacher")}><input className={inputCls()} name="teacher" defaultValue={str("teacher")} /></Field>
            <Field label="Tradition" error={err("tradition")}><input className={inputCls()} name="tradition" defaultValue={str("tradition")} /></Field>
            <Field label="Language" error={err("language")}><input className={inputCls()} name="language" defaultValue={str("language")} /></Field>
            <Field label="Format" error={err("format")}>
              <select className={inputCls()} name="format" defaultValue={str("format")}>
                <option value="">—</option>
                <option value="text">Text</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </select>
            </Field>
          </div>
          <Field label="Chapters / sections (one per line)" error={err("chapters")}>
            <textarea className={areaCls()} name="chapters" defaultValue={lines("chapters")} placeholder="Introduction&#10;Chapter 1" />
          </Field>
        </div>
      );
    case "stotra":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Deity" error={err("deity")}><input className={inputCls()} name="deity" defaultValue={str("deity")} /></Field>
            <Field label="Tradition" error={err("tradition")}><input className={inputCls()} name="tradition" defaultValue={str("tradition")} /></Field>
            <Field label="Language" error={err("language")}><input className={inputCls()} name="language" defaultValue={str("language")} /></Field>
            <Field label="Script" error={err("script")}><input className={inputCls()} name="script" defaultValue={str("script")} /></Field>
          </div>
          <Field label="Mantras / shlokas (one per line)" error={err("mantras")}>
            <textarea className={areaCls()} name="mantras" defaultValue={lines("mantras")} placeholder="Om Namah Shivaya&#10;Shri Ram Jai Ram" />
          </Field>
          <Field label="Text (full stotra)" error={err("text")}>
            <textarea className="min-h-32 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30" name="text" defaultValue={str("text")} placeholder="Full text of the stotra…" />
          </Field>
        </div>
      );
    case "deity_concept":
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tradition" error={err("tradition")}><input className={inputCls()} name="tradition" defaultValue={str("tradition")} /></Field>
            <Field label="Language" error={err("language")}><input className={inputCls()} name="language" defaultValue={str("language")} /></Field>
            <Field label="Aliases (comma-separated)" error={err("aliases")}>
              <input className={inputCls()} name="aliases" defaultValue={csv("aliases")} />
            </Field>
          </div>
          <Field label="Mantras (one per line)" error={err("mantras")}>
            <textarea className={areaCls()} name="mantras" defaultValue={lines("mantras")} placeholder="Om Namah Shivaya&#10;Om Gam Ganapataye Namah" />
          </Field>
          <Field label="Description of the deity form" error={err("description")}>
            <textarea className={areaCls()} name="description" defaultValue={str("description")} placeholder="Attributes, symbolism, iconography…" />
          </Field>
        </div>
      );
    default:
      return null;
  }
}

export function SourceForm({ action, themes, initial, isEdit = false }: SourceFormProps) {
  const [state, formAction, pending] = useActionState(action, initialMutationState);
  const [selectedType, setSelectedType] = useState<string>(initial?.type ?? "");

  const selectedThemeIds = initial?.themes?.map((t) => t.id) ?? [];
  const initialMeta = initial?.metadata as Record<string, unknown> | undefined;

  return (
    <form action={formAction} className="grid gap-5">
      {state.status === "error" && (
        <div className="border-l-4 border-danger bg-danger/8 px-4 py-3 text-sm text-danger">
          {state.message ?? "The source could not be saved."}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" error={state.fieldErrors?.type}>
          {isEdit ? (
            <>
              <input type="hidden" name="type" value={initial?.type ?? ""} />
              <div className={`${inputCls()} flex items-center bg-surface-muted text-muted-foreground`}>
                {initial?.type ? sourceTypeDetails[initial.type as keyof typeof sourceTypeDetails]?.label : "—"}
              </div>
            </>
          ) : (
            <select
              className={inputCls()}
              name="type"
              defaultValue={initial?.type ?? ""}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">Choose a type…</option>
              {sourceTypes.map((type) => (
                <option key={type} value={type}>
                  {sourceTypeDetails[type].label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Status" error={state.fieldErrors?.status}>
          <select className={inputCls()} name="status" defaultValue={initial?.status ?? "active"}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
      </div>

      <Field label="Title" error={state.fieldErrors?.title}>
        <input
          className={inputCls()}
          name="title"
          defaultValue={initial?.title ?? ""}
          placeholder="Name of the source"
          required
        />
      </Field>

      <Field label="Description">
        <textarea
          className="min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          name="description"
          defaultValue={initial?.description ?? ""}
          placeholder="Optional description"
        />
      </Field>

      {(selectedType || isEdit) && (
        <fieldset className="grid gap-4 rounded-md border border-border p-4">
          <legend className="px-1 text-xs font-medium text-muted-foreground">
            {selectedType ? sourceTypeDetails[selectedType as keyof typeof sourceTypeDetails]?.label ?? selectedType : ""} details
          </legend>
          <MetadataFields type={isEdit ? (initial?.type ?? "") : selectedType} initial={initialMeta} errors={state.fieldErrors} />
        </fieldset>
      )}

      <div className="grid gap-2">
        <span className="text-sm font-medium">Themes</span>
        <TaxonomyPicker themes={themes} selectedIds={selectedThemeIds} />
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create source"}
        </Button>
      </div>
    </form>
  );
}
