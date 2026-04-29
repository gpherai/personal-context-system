import { z } from "zod";

import {
  createEntryCommandSchema,
  listEntriesQuerySchema,
  parseNameList,
  parseOptionalDate,
  parseOptionalNumber,
  parseOptionalString,
  titleFromBody
} from "@/domain/context";
import type { ContextRepository } from "@/repositories/context-repository";

export type CaptureEntryState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialCaptureEntryState: CaptureEntryState = {
  status: "idle"
};

export function parseCreateEntryFormData(formData: FormData) {
  const body = parseOptionalString(formData.get("body")) ?? "";
  const raw = {
    type: parseOptionalString(formData.get("type")) ?? "observation",
    status: parseOptionalString(formData.get("status")) ?? "active",
    title: parseOptionalString(formData.get("title")) ?? titleFromBody(body),
    body,
    summary: parseOptionalString(formData.get("summary")),
    source: parseOptionalString(formData.get("source")),
    confidence: parseOptionalNumber(formData.get("confidence")),
    privacyLevel: parseOptionalString(formData.get("privacyLevel")) ?? "private",
    occurredAt: parseOptionalDate(formData.get("occurredAt")),
    metadata: {},
    themeNames: parseNameList(formData.get("themes")),
    projectNames: parseNameList(formData.get("projects"))
  };

  return createEntryCommandSchema.safeParse(raw);
}

export async function captureEntry(formData: FormData, repository: ContextRepository) {
  const parsed = parseCreateEntryFormData(formData);

  if (!parsed.success) {
    return {
      ok: false as const,
      state: {
        status: "error" as const,
        message: "Controleer de gemarkeerde velden.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors
      }
    };
  }

  const entry = await repository.createEntry(parsed.data);
  return { ok: true as const, entry };
}

export async function listEntries(repository: ContextRepository, params?: URLSearchParams) {
  const parsed = listEntriesQuerySchema.safeParse({
    search: parseOptionalString(params?.get("search") ?? null),
    type: parseOptionalString(params?.get("type") ?? null),
    status: parseOptionalString(params?.get("status") ?? null),
    privacyLevel: parseOptionalString(params?.get("privacyLevel") ?? null),
    limit: 100
  });

  return repository.listEntries(parsed.success ? parsed.data : { limit: 100 });
}
