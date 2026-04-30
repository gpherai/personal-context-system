import { z } from "zod";

import {
  createAttachmentCommandSchema,
  createEntryCommandSchema,
  createReferenceCommandSchema,
  createSavedFilterCommandSchema,
  createThreadCommandSchema,
  linkObjectsCommandSchema,
  listEntriesQuerySchema,
  parseIdList,
  parseNameList,
  parseOptionalDate,
  parseOptionalNumber,
  parseOptionalString,
  promoteEntryToQuestionCommandSchema,
  titleFromBody,
  updateEntryCommandSchema,
  updateQuestionCommandSchema
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

export type MutationState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialMutationState: MutationState = {
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

export function parseUpdateEntryFormData(id: string, formData: FormData) {
  const body = parseOptionalString(formData.get("body")) ?? "";
  const raw = {
    id,
    type: parseOptionalString(formData.get("type")) ?? "observation",
    status: parseOptionalString(formData.get("status")) ?? "active",
    title: parseOptionalString(formData.get("title")) ?? titleFromBody(body),
    body,
    summary: parseOptionalString(formData.get("summary")),
    source: parseOptionalString(formData.get("source")),
    confidence: parseOptionalNumber(formData.get("confidence")),
    privacyLevel: parseOptionalString(formData.get("privacyLevel")) ?? "private",
    occurredAt: parseOptionalDate(formData.get("occurredAt")),
    themeNames: parseNameList(formData.get("themes")),
    projectNames: parseNameList(formData.get("projects"))
  };

  return updateEntryCommandSchema.safeParse(raw);
}

export function parseUpdateQuestionFormData(id: string, formData: FormData) {
  return updateQuestionCommandSchema.safeParse({
    id,
    status: parseOptionalString(formData.get("status")) ?? "open",
    summary: parseOptionalString(formData.get("summary"))
  });
}

export function parsePromoteEntryToQuestion(id: string) {
  return promoteEntryToQuestionCommandSchema.safeParse({ id });
}

export function parseLinkObjectsFormData(formData: FormData) {
  const target = parseOptionalString(formData.get("target"));
  const separatorIndex = target?.indexOf(":") ?? -1;
  const targetType = separatorIndex > 0 ? target?.slice(0, separatorIndex) : undefined;
  const targetId = separatorIndex > 0 ? target?.slice(separatorIndex + 1) : undefined;

  return linkObjectsCommandSchema.safeParse({
    fromType: parseOptionalString(formData.get("fromType")),
    fromId: parseOptionalString(formData.get("fromId")),
    toType: targetType,
    toId: targetId,
    relationType: parseOptionalString(formData.get("relationType")) ?? "relates_to",
    note: parseOptionalString(formData.get("note"))
  });
}

export function parseCreateReferenceFormData(entryId: string, formData: FormData) {
  return createReferenceCommandSchema.safeParse({
    entryId,
    kind: parseOptionalString(formData.get("kind")) ?? "url",
    title: parseOptionalString(formData.get("title")),
    url: parseOptionalString(formData.get("url")),
    description: parseOptionalString(formData.get("description")),
    metadata: {}
  });
}

export function parseCreateAttachmentFormData(entryId: string, formData: FormData) {
  return createAttachmentCommandSchema.safeParse({
    entryId,
    path: parseOptionalString(formData.get("path")),
    mediaType: parseOptionalString(formData.get("mediaType")),
    checksum: parseOptionalString(formData.get("checksum")),
    sizeBytes: parseOptionalNumber(formData.get("sizeBytes")),
    title: parseOptionalString(formData.get("title")),
    description: parseOptionalString(formData.get("description")),
    metadata: {}
  });
}

export function parseCreateThreadFormData(formData: FormData) {
  return createThreadCommandSchema.safeParse({
    title: parseOptionalString(formData.get("title")),
    description: parseOptionalString(formData.get("description")),
    status: parseOptionalString(formData.get("status")) ?? "active",
    entryIds: parseIdList(formData.get("entryIds")),
    metadata: {}
  });
}

export function parseCreateSavedFilterFormData(formData: FormData) {
  const rawParams = {
    search: parseOptionalString(formData.get("search")),
    type: parseOptionalString(formData.get("type")),
    status: parseOptionalString(formData.get("status")),
    privacyLevel: parseOptionalString(formData.get("privacyLevel")),
    themeSlug: parseOptionalString(formData.get("themeSlug")),
    projectSlug: parseOptionalString(formData.get("projectSlug")),
    questionId: parseOptionalString(formData.get("questionId")),
    occurredFrom: parseOptionalString(formData.get("occurredFrom")),
    occurredTo: parseOptionalString(formData.get("occurredTo"))
  };
  const params = Object.fromEntries(Object.entries(rawParams).filter(([, value]) => value !== undefined));

  return createSavedFilterCommandSchema.safeParse({
    name: parseOptionalString(formData.get("name")),
    description: parseOptionalString(formData.get("description")),
    params
  });
}

export async function captureEntry(formData: FormData, repository: ContextRepository) {
  const parsed = parseCreateEntryFormData(formData);

  if (!parsed.success) {
    return {
      ok: false as const,
      state: {
        status: "error" as const,
        message: "Check the highlighted fields.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors
      }
    };
  }

  const entry = await repository.createEntry(parsed.data);
  return { ok: true as const, entry };
}

function errorState(message: string, error: z.ZodError): MutationState {
  return {
    status: "error",
    message,
    fieldErrors: z.flattenError(error).fieldErrors
  };
}

export async function updateEntryFromForm(id: string, formData: FormData, repository: ContextRepository) {
  const parsed = parseUpdateEntryFormData(id, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the highlighted fields.", parsed.error) };
  }

  const entry = await repository.updateEntry(parsed.data);
  return { ok: true as const, entry };
}

export async function updateQuestionFromForm(id: string, formData: FormData, repository: ContextRepository) {
  const parsed = parseUpdateQuestionFormData(id, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the highlighted fields.", parsed.error) };
  }

  const question = await repository.updateQuestion(parsed.data);
  return { ok: true as const, question };
}

export async function linkObjectsFromForm(formData: FormData, repository: ContextRepository) {
  const parsed = parseLinkObjectsFormData(formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the relationship fields.", parsed.error) };
  }

  const relationship = await repository.linkObjects(parsed.data);
  return { ok: true as const, relationship };
}

export async function createReferenceFromForm(entryId: string, formData: FormData, repository: ContextRepository) {
  const parsed = parseCreateReferenceFormData(entryId, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the reference fields.", parsed.error) };
  }

  const reference = await repository.createReference(parsed.data);
  return { ok: true as const, reference };
}

export async function createAttachmentFromForm(entryId: string, formData: FormData, repository: ContextRepository) {
  const parsed = parseCreateAttachmentFormData(entryId, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the attachment fields.", parsed.error) };
  }

  const attachment = await repository.createAttachment(parsed.data);
  return { ok: true as const, attachment };
}

export async function createThreadFromForm(formData: FormData, repository: ContextRepository) {
  const parsed = parseCreateThreadFormData(formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the thread fields.", parsed.error) };
  }

  const thread = await repository.createThread(parsed.data);
  return { ok: true as const, thread };
}

export async function createSavedFilterFromForm(formData: FormData, repository: ContextRepository) {
  const parsed = parseCreateSavedFilterFormData(formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the filter fields.", parsed.error) };
  }

  const savedFilter = await repository.createSavedFilter(parsed.data);
  return { ok: true as const, savedFilter };
}

export async function promoteEntryToQuestion(id: string, repository: ContextRepository) {
  const parsed = parsePromoteEntryToQuestion(id);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("This entry could not be promoted.", parsed.error) };
  }

  const question = await repository.promoteEntryToQuestion(parsed.data);
  return { ok: true as const, question };
}

export async function listEntries(repository: ContextRepository, params?: URLSearchParams) {
  const parsed = listEntriesQuerySchema.safeParse({
    search: parseOptionalString(params?.get("search") ?? null),
    type: parseOptionalString(params?.get("type") ?? null),
    status: parseOptionalString(params?.get("status") ?? null),
    privacyLevel: parseOptionalString(params?.get("privacyLevel") ?? null),
    themeSlug: parseOptionalString(params?.get("themeSlug") ?? null),
    projectSlug: parseOptionalString(params?.get("projectSlug") ?? null),
    questionId: parseOptionalString(params?.get("questionId") ?? null),
    occurredFrom: parseOptionalDate(params?.get("occurredFrom") ?? null),
    occurredTo: parseOptionalDate(params?.get("occurredTo") ?? null),
    limit: 100
  });

  return repository.listEntries(parsed.success ? parsed.data : { limit: 100 });
}
