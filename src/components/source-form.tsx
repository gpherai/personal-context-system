"use client";

import { useActionState, useState } from "react";

import { initialMutationState } from "@/application/context-service";
import { TaxonomyPicker } from "@/components/taxonomy-picker";
import { Button } from "@/components/ui/button";
import { sourceTypes } from "@/domain/context";
import { sourceTypeDetails } from "@/domain/taxonomy";
import type { MutationState } from "@/application/context-service";
import type { SourceRecord } from "@/repositories/context-repository";

interface Theme {
  id: string;
  name: string;
  slug: string;
}

interface SourceFormProps {
  action: (state: MutationState, formData: FormData) => Promise<MutationState>;
  themes: Theme[];
  initial?: Partial<SourceRecord>;
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
  return "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20";
}

function MetadataFields({ type, initial }: { type: string; initial?: Record<string, unknown> }) {
  const m = (initial ?? {}) as Record<string, unknown>;
  const str = (k: string) => (typeof m[k] === "string" ? String(m[k]) : "");
  const num = (k: string) => (typeof m[k] === "number" ? String(m[k]) : "");

  switch (type) {
    case "video":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL"><input className={inputCls()} name="url" defaultValue={str("url")} type="url" /></Field>
          <Field label="Kanaal"><input className={inputCls()} name="channel" defaultValue={str("channel")} /></Field>
          <Field label="Duur (sec)"><input className={inputCls()} name="duration" defaultValue={num("duration")} type="number" min="0" /></Field>
          <Field label="Taal"><input className={inputCls()} name="language" defaultValue={str("language")} /></Field>
        </div>
      );
    case "book":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Auteurs (kommagescheiden)"><input className={inputCls()} name="authors" defaultValue={Array.isArray(m.authors) ? (m.authors as string[]).join(", ") : ""} /></Field>
          <Field label="ISBN"><input className={inputCls()} name="isbn" defaultValue={str("isbn")} /></Field>
          <Field label="Jaar"><input className={inputCls()} name="year" defaultValue={num("year")} type="number" /></Field>
          <Field label="Uitgever"><input className={inputCls()} name="publisher" defaultValue={str("publisher")} /></Field>
          <Field label="Taal"><input className={inputCls()} name="language" defaultValue={str("language")} /></Field>
        </div>
      );
    case "post":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL"><input className={inputCls()} name="url" defaultValue={str("url")} type="url" /></Field>
          <Field label="Auteur"><input className={inputCls()} name="author" defaultValue={str("author")} /></Field>
          <Field label="Gepubliceerd"><input className={inputCls()} name="publishedAt" defaultValue={str("publishedAt")} /></Field>
        </div>
      );
    case "image":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL"><input className={inputCls()} name="url" defaultValue={str("url")} type="url" /></Field>
          <Field label="Alt tekst"><input className={inputCls()} name="alt" defaultValue={str("alt")} /></Field>
          <Field label="Fotograaf"><input className={inputCls()} name="photographer" defaultValue={str("photographer")} /></Field>
        </div>
      );
    case "sadhana":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Traditie"><input className={inputCls()} name="tradition" defaultValue={str("tradition")} /></Field>
          <Field label="Godheid"><input className={inputCls()} name="deity" defaultValue={str("deity")} /></Field>
          <Field label="Taal"><input className={inputCls()} name="language" defaultValue={str("language")} /></Field>
          <Field label="Formaat">
            <select className={inputCls()} name="format" defaultValue={str("format")}>
              <option value="">—</option>
              <option value="text">Tekst</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
            </select>
          </Field>
        </div>
      );
    case "upadesha":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Leraar"><input className={inputCls()} name="teacher" defaultValue={str("teacher")} /></Field>
          <Field label="Traditie"><input className={inputCls()} name="tradition" defaultValue={str("tradition")} /></Field>
          <Field label="Taal"><input className={inputCls()} name="language" defaultValue={str("language")} /></Field>
          <Field label="Formaat">
            <select className={inputCls()} name="format" defaultValue={str("format")}>
              <option value="">—</option>
              <option value="text">Tekst</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
            </select>
          </Field>
        </div>
      );
    case "stotra":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Godheid"><input className={inputCls()} name="deity" defaultValue={str("deity")} /></Field>
          <Field label="Traditie"><input className={inputCls()} name="tradition" defaultValue={str("tradition")} /></Field>
          <Field label="Taal"><input className={inputCls()} name="language" defaultValue={str("language")} /></Field>
          <Field label="Script"><input className={inputCls()} name="script" defaultValue={str("script")} /></Field>
        </div>
      );
    case "deity_concept":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Traditie"><input className={inputCls()} name="tradition" defaultValue={str("tradition")} /></Field>
          <Field label="Taal"><input className={inputCls()} name="language" defaultValue={str("language")} /></Field>
          <Field label="Aliassen (kommagescheiden)">
            <input className={inputCls()} name="aliases" defaultValue={Array.isArray(m.aliases) ? (m.aliases as string[]).join(", ") : ""} />
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
          {state.message ?? "De bron kon niet worden opgeslagen."}
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
              <option value="">Kies een type…</option>
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
            <option value="active">Actief</option>
            <option value="archived">Gearchiveerd</option>
          </select>
        </Field>
      </div>

      <Field label="Titel" error={state.fieldErrors?.title}>
        <input
          className={inputCls()}
          name="title"
          defaultValue={initial?.title ?? ""}
          placeholder="Naam van de bron"
          required
        />
      </Field>

      <Field label="Beschrijving">
        <textarea
          className="min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm leading-6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          name="description"
          defaultValue={initial?.description ?? ""}
          placeholder="Optionele beschrijving"
        />
      </Field>

      {(selectedType || isEdit) && (
        <fieldset className="grid gap-4 rounded-md border border-border p-4">
          <legend className="px-1 text-xs font-medium text-muted-foreground">
            {selectedType ? sourceTypeDetails[selectedType as keyof typeof sourceTypeDetails]?.label ?? selectedType : ""} details
          </legend>
          <MetadataFields type={isEdit ? (initial?.type ?? "") : selectedType} initial={initialMeta} />
        </fieldset>
      )}

      <div className="grid gap-2">
        <span className="text-sm font-medium">Thema&apos;s</span>
        <TaxonomyPicker themes={themes} selectedIds={selectedThemeIds} />
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Opslaan…" : isEdit ? "Wijzigingen opslaan" : "Bron aanmaken"}
        </Button>
      </div>
    </form>
  );
}
