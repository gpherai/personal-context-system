import "server-only";

import { z } from "zod";

import { buildContextMirror } from "@/ai-context/context-mirror";
import { sanatanaTaxonomyExtension } from "@/ai-context/sanatana-taxonomy";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { writeContextMirror } from "@/infrastructure/files/context-mirror-writer";

import { databaseMutationErrorState, isRecoverableReadError } from "./errors";
import {
  createAttachmentCommandSchema,
  createEntryCommandSchema,
  createReferenceCommandSchema,
  createSavedFilterCommandSchema,
  createSourceCommandSchema,
  createThreadCommandSchema,
  deleteSourceCommandSchema,
  entryTypeSchema,
  linkObjectsCommandSchema,
  listEntriesQuerySchema,
  listSourcesQuerySchema,
  parseIdList,
  parseLineList,
  parseNameList,
  parseOptionalDate,
  parseOptionalNumber,
  parseOptionalString,
  privacyLevelSchema,
  promoteEntryToQuestionCommandSchema,
  recordStatusSchema,
  sourceTypeSchema,
  titleFromBody,
  updateEntryCommandSchema,
  updateQuestionCommandSchema,
  updateSourceCommandSchema
} from "@/domain/context";
import type {
  EntryRepository,
  FilterRepository,
  QuestionRepository,
  RelationshipRepository,
  SnapshotRepository,
  SourceRepository,
  ThreadRepository
} from "@/repositories/context-repository";
import type { MutationState } from "./action-states";

export type { CaptureEntryState, MutationState } from "./action-states";
export { initialCaptureEntryState, initialMutationState } from "./action-states";

function formStr(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

export function parseCreateEntryFormData(formData: FormData) {
  const body = parseOptionalString(formStr(formData, "body")) ?? "";
  const raw = {
    type: parseOptionalString(formStr(formData, "type")) ?? "observation",
    status: parseOptionalString(formStr(formData, "status")) ?? "active",
    title: parseOptionalString(formStr(formData, "title")) ?? titleFromBody(body),
    body,
    summary: parseOptionalString(formStr(formData, "summary")),
    source: parseOptionalString(formStr(formData, "source")),
    confidence: parseOptionalNumber(formStr(formData, "confidence")),
    privacyLevel: parseOptionalString(formStr(formData, "privacyLevel")) ?? "private",
    occurredAt: parseOptionalDate(formStr(formData, "occurredAt")),
    metadata: {},
    themeNames: parseNameList(formStr(formData, "themes")),
    projectNames: parseNameList(formStr(formData, "projects"))
  };

  return createEntryCommandSchema.safeParse(raw);
}

export function parseUpdateEntryFormData(id: string, formData: FormData) {
  const body = parseOptionalString(formStr(formData, "body")) ?? "";
  const raw = {
    id,
    status: parseOptionalString(formStr(formData, "status")),
    title: parseOptionalString(formStr(formData, "title")) ?? titleFromBody(body),
    body,
    summary: parseOptionalString(formStr(formData, "summary")),
    source: parseOptionalString(formStr(formData, "source")),
    confidence: parseOptionalNumber(formStr(formData, "confidence")),
    privacyLevel: parseOptionalString(formStr(formData, "privacyLevel")),
    occurredAt: parseOptionalDate(formStr(formData, "occurredAt")),
    themeNames: parseNameList(formStr(formData, "themes")),
    projectNames: parseNameList(formStr(formData, "projects"))
  };

  return updateEntryCommandSchema.safeParse(raw);
}

export function parseUpdateQuestionFormData(id: string, formData: FormData) {
  return updateQuestionCommandSchema.safeParse({
    id,
    status: parseOptionalString(formStr(formData, "status")),
    summary: parseOptionalString(formStr(formData, "summary"))
  });
}

export function parsePromoteEntryToQuestion(id: string) {
  return promoteEntryToQuestionCommandSchema.safeParse({ id });
}

export function parseLinkObjectsFormData(formData: FormData) {
  const target = parseOptionalString(formStr(formData, "target"));
  const separatorIndex = target?.indexOf(":") ?? -1;
  const targetType = separatorIndex > 0 ? target?.slice(0, separatorIndex) : undefined;
  const targetId = separatorIndex > 0 ? target?.slice(separatorIndex + 1) : undefined;

  return linkObjectsCommandSchema.safeParse({
    fromType: parseOptionalString(formStr(formData, "fromType")),
    fromId: parseOptionalString(formStr(formData, "fromId")),
    toType: targetType,
    toId: targetId,
    relationType: parseOptionalString(formStr(formData, "relationType")) ?? "relates_to",
    note: parseOptionalString(formStr(formData, "note"))
  });
}

export function parseCreateReferenceFormData(entryId: string, formData: FormData) {
  return createReferenceCommandSchema.safeParse({
    entryId,
    kind: parseOptionalString(formStr(formData, "kind")) ?? "url",
    title: parseOptionalString(formStr(formData, "title")),
    url: parseOptionalString(formStr(formData, "url")),
    description: parseOptionalString(formStr(formData, "description")),
    metadata: {}
  });
}

export function parseCreateAttachmentFormData(entryId: string, formData: FormData) {
  return createAttachmentCommandSchema.safeParse({
    entryId,
    path: parseOptionalString(formStr(formData, "path")),
    mediaType: parseOptionalString(formStr(formData, "mediaType")),
    checksum: parseOptionalString(formStr(formData, "checksum")),
    sizeBytes: parseOptionalNumber(formStr(formData, "sizeBytes")),
    title: parseOptionalString(formStr(formData, "title")),
    description: parseOptionalString(formStr(formData, "description")),
    metadata: {}
  });
}

export function parseCreateThreadFormData(formData: FormData) {
  return createThreadCommandSchema.safeParse({
    title: parseOptionalString(formStr(formData, "title")),
    description: parseOptionalString(formStr(formData, "description")),
    status: parseOptionalString(formStr(formData, "status")) ?? "active",
    entryIds: parseIdList(formStr(formData, "entryIds")),
    metadata: {}
  });
}

export function parseCreateSavedFilterFormData(formData: FormData) {
  const rawParams = {
    search: parseOptionalString(formStr(formData, "search")),
    type: parseOptionalString(formStr(formData, "type")),
    status: parseOptionalString(formStr(formData, "status")),
    privacyLevel: parseOptionalString(formStr(formData, "privacyLevel")),
    themeSlug: parseOptionalString(formStr(formData, "themeSlug")),
    projectSlug: parseOptionalString(formStr(formData, "projectSlug")),
    questionId: parseOptionalString(formStr(formData, "questionId")),
    occurredFrom: parseOptionalString(formStr(formData, "occurredFrom")),
    occurredTo: parseOptionalString(formStr(formData, "occurredTo"))
  };
  const params = Object.fromEntries(Object.entries(rawParams).filter(([, value]) => value !== undefined));

  return createSavedFilterCommandSchema.safeParse({
    name: parseOptionalString(formStr(formData, "name")),
    description: parseOptionalString(formStr(formData, "description")),
    params
  });
}

export async function captureEntry(formData: FormData, repository: EntryRepository) {
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

  return withDbErrorHandling(async () => {
    const entry = await repository.createEntry(parsed.data);

    const rawUrl = parseOptionalString(formData.get("url") as string | null);
    if (rawUrl) {
      try {
        new URL(rawUrl);
        let title = rawUrl;
        try { title = new URL(rawUrl).hostname; } catch { /* keep full url */ }
        const refParsed = createReferenceCommandSchema.safeParse({
          entryId: entry.id,
          kind: "url",
          title,
          url: rawUrl,
          metadata: {}
        });
        if (refParsed.success) {
          await repository.createReference(refParsed.data);
        }
      } catch { /* invalid URL — skip */ }
    }

    return { ok: true as const, entry };
  });
}

function errorState(message: string, error: z.ZodError): MutationState {
  return {
    status: "error",
    message,
    fieldErrors: z.flattenError(error).fieldErrors
  };
}

function sourceErrorState(message: string, error: z.ZodError): MutationState {
  const flat = z.flattenError(error);
  const merged: Record<string, string[]> = { ...flat.fieldErrors };
  for (const issue of error.issues) {
    if (issue.path.length >= 2 && issue.path[0] === "metadata") {
      const key = String(issue.path[1]);
      merged[key] = [...(merged[key] ?? []), issue.message];
    }
  }
  if (error.issues.some((i) => i.path.length >= 2 && i.path[0] === "metadata")) {
    delete merged.metadata;
  }
  return { status: "error", message, fieldErrors: merged };
}

async function withDbErrorHandling<T extends { ok: true }>(
  fn: () => Promise<T>
): Promise<T | { ok: false; state: { status: "error"; message: string } }> {
  try {
    return await fn();
  } catch (error) {
    if (isRecoverableReadError(error)) {
      return { ok: false, state: databaseMutationErrorState() };
    }
    throw error;
  }
}

export async function updateEntryFromForm(id: string, formData: FormData, repository: EntryRepository) {
  const parsed = parseUpdateEntryFormData(id, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the highlighted fields.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const entry = await repository.updateEntry(parsed.data);
    return { ok: true as const, entry };
  });
}

export async function updateQuestionFromForm(id: string, formData: FormData, repository: QuestionRepository) {
  const parsed = parseUpdateQuestionFormData(id, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the highlighted fields.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const question = await repository.updateQuestion(parsed.data);
    return { ok: true as const, question };
  });
}

export async function linkObjectsFromForm(formData: FormData, repository: RelationshipRepository) {
  const parsed = parseLinkObjectsFormData(formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the relationship fields.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const relationship = await repository.linkObjects(parsed.data);
    return { ok: true as const, relationship };
  });
}

export async function createReferenceFromForm(entryId: string, formData: FormData, repository: EntryRepository) {
  const parsed = parseCreateReferenceFormData(entryId, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the reference fields.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const reference = await repository.createReference(parsed.data);
    return { ok: true as const, reference };
  });
}

export async function createAttachmentFromForm(entryId: string, formData: FormData, repository: EntryRepository) {
  const parsed = parseCreateAttachmentFormData(entryId, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the attachment fields.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const attachment = await repository.createAttachment(parsed.data);
    return { ok: true as const, attachment };
  });
}

export async function createThreadFromForm(formData: FormData, repository: ThreadRepository) {
  const parsed = parseCreateThreadFormData(formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the thread fields.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const thread = await repository.createThread(parsed.data);
    return { ok: true as const, thread };
  });
}

export async function createSavedFilterFromForm(formData: FormData, repository: FilterRepository) {
  const parsed = parseCreateSavedFilterFormData(formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the filter fields.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const savedFilter = await repository.createSavedFilter(parsed.data);
    return { ok: true as const, savedFilter };
  });
}

export async function promoteEntryToQuestion(id: string, repository: EntryRepository) {
  const parsed = parsePromoteEntryToQuestion(id);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("This entry could not be promoted.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const question = await repository.promoteEntryToQuestion(parsed.data);
    return { ok: true as const, question };
  });
}

function buildRawSourceMetadata(type: string, formData: FormData): Record<string, unknown> {
  const str = (key: string) => parseOptionalString(formStr(formData, key));
  const num = (key: string) => parseOptionalNumber(formStr(formData, key));
  return {
    type,
    duration: num("duration"),
    channel: str("channel"),
    language: str("language"),
    authors: parseNameList(formStr(formData, "authors")),
    isbn: str("isbn"),
    year: num("year"),
    publisher: str("publisher"),
    author: str("author"),
    publishedAt: str("publishedAt"),
    alt: str("alt"),
    photographer: str("photographer"),
    format: str("format"),
    chapters: parseLineList(formStr(formData, "chapters")),
    steps: parseLineList(formStr(formData, "steps")),
    mantras: parseLineList(formStr(formData, "mantras")),
    script: str("script"),
    aliases: parseNameList(formStr(formData, "aliases")),
    tradition: str("tradition"),
    lineage: str("lineage"),
    period: str("period")
  };
}

export function parseCreateSourceFormData(formData: FormData) {
  const type = parseOptionalString(formStr(formData, "type")) ?? "";
  return createSourceCommandSchema.safeParse({
    type,
    title: parseOptionalString(formStr(formData, "title")),
    description: parseOptionalString(formStr(formData, "description")),
    body: parseOptionalString(formStr(formData, "body")),
    status: parseOptionalString(formStr(formData, "status")) ?? "active",
    metadata: buildRawSourceMetadata(type, formData),
    themeIds: parseIdList(formStr(formData, "themeIds")),
    referenceIds: parseIdList(formStr(formData, "referenceIds"))
  });
}

export function parseUpdateSourceFormData(id: string, formData: FormData) {
  const type = parseOptionalString(formStr(formData, "type")) ?? "";
  return updateSourceCommandSchema.safeParse({
    id,
    title: parseOptionalString(formStr(formData, "title")),
    description: parseOptionalString(formStr(formData, "description")),
    body: parseOptionalString(formStr(formData, "body")),
    status: parseOptionalString(formStr(formData, "status")),
    metadata: buildRawSourceMetadata(type, formData),
    themeIds: parseIdList(formStr(formData, "themeIds")),
    referenceIds: parseIdList(formStr(formData, "referenceIds"))
  });
}

async function resolveNewReferenceIds(formData: FormData, repository: SourceRepository): Promise<string[]> {
  const raw = formData.get("newReferenceUrls");
  if (typeof raw !== "string" || !raw.trim()) return [];

  const ids: string[] = [];
  for (const entry of raw.split(";;;")) {
    const parts = entry.split("||");
    if (parts.length < 2) continue;
    const title = parts[0]?.trim();
    const url = parts[1]?.trim();
    if (!url) continue;
    try {
      new URL(url);
      const ref = await repository.createStandaloneReference(title || url, url);
      ids.push(ref.id);
    } catch { /* invalid URL — skip */ }
  }
  return ids;
}

function extractPickerSourceIds(formData: FormData): string[] {
  return [
    ...formData.getAll("deitySourceIds"),
    ...formData.getAll("teacherSourceIds"),
    ...formData.getAll("stotraSourceIds"),
  ].filter((v): v is string => typeof v === "string" && v.length > 0);
}

export async function captureSource(formData: FormData, repository: SourceRepository & RelationshipRepository) {
  const parsed = parseCreateSourceFormData(formData);

  if (!parsed.success) {
    return { ok: false as const, state: sourceErrorState("Check the highlighted fields.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const newRefIds = await resolveNewReferenceIds(formData, repository);
    const command = { ...parsed.data, referenceIds: [...parsed.data.referenceIds, ...newRefIds] };
    const source = await repository.createSource(command);
    const pickerIds = extractPickerSourceIds(formData);
    for (const toId of pickerIds) {
      await repository.linkObjects({ fromType: "source", fromId: source.id, toType: "source", toId, relationType: "relates_to" });
    }
    return { ok: true as const, source };
  });
}

export async function updateSourceFromForm(id: string, formData: FormData, repository: SourceRepository & RelationshipRepository) {
  const parsed = parseUpdateSourceFormData(id, formData);

  if (!parsed.success) {
    return { ok: false as const, state: sourceErrorState("Check the highlighted fields.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const newRefIds = await resolveNewReferenceIds(formData, repository);
    const command = { ...parsed.data, referenceIds: [...parsed.data.referenceIds, ...newRefIds] };
    const source = await repository.updateSource(command);
    const pickerIds = extractPickerSourceIds(formData);
    await repository.replaceOutgoingRelationships("source", id, "source", "relates_to", pickerIds);
    return { ok: true as const, source };
  });
}

export async function deleteSource(id: string, repository: SourceRepository) {
  const parsed = deleteSourceCommandSchema.safeParse({ id });

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Invalid source id.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    await repository.deleteSource(parsed.data.id);
    return { ok: true as const };
  });
}

const laxListSourcesQuerySchema = listSourcesQuerySchema.extend({
  type: sourceTypeSchema.optional().catch(undefined),
  status: recordStatusSchema.optional().catch(undefined)
});

export async function listSources(repository: SourceRepository, params?: URLSearchParams) {
  const parsed = laxListSourcesQuerySchema.parse({
    search: parseOptionalString(params?.get("search") ?? null),
    type: parseOptionalString(params?.get("type") ?? null),
    themeId: parseOptionalString(params?.get("themeId") ?? null),
    status: parseOptionalString(params?.get("status") ?? null),
    limit: 100
  });

  return repository.listSources(parsed);
}

const laxListEntriesQuerySchema = listEntriesQuerySchema.extend({
  type: entryTypeSchema.optional().catch(undefined),
  status: recordStatusSchema.optional().catch(undefined),
  privacyLevel: privacyLevelSchema.optional().catch(undefined)
});

export async function listEntries(repository: EntryRepository, params?: URLSearchParams) {
  const parsed = laxListEntriesQuerySchema.parse({
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

  return repository.listEntries(parsed);
}

export async function rebuildMirror(repository?: SnapshotRepository) {
  const snapshot = await (repository ?? createPrismaContextRepository()).getContextMirrorSnapshot();
  const build = buildContextMirror(snapshot, new Date(), [sanatanaTaxonomyExtension]);
  return writeContextMirror(build);
}
