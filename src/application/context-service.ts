import "server-only";

import { z } from "zod";

import { buildContextMirror, generateBundle, type GeneratedBundle } from "@/ai-context/context-mirror";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { writeContextMirror } from "@/infrastructure/files/context-mirror-writer";

import { databaseMutationErrorState, isDatabaseUnavailable } from "./errors";
import {
  addEntryToThreadCommandSchema,
  createAttachmentCommandSchema,
  createDecisionCommandSchema,
  createEntryCommandSchema,
  createReferenceCommandSchema,
  createSavedFilterCommandSchema,
  createSourceCommandSchema,
  createTaskCommandSchema,
  createThreadCommandSchema,
  deleteSourceCommandSchema,
  entryTypeSchema,
  isQuestionClosingStatus,
  isValidDecisionStatusTransition,
  listEntriesQuerySchema,
  listSourcesQuerySchema,
  mergeThemeCommandSchema,
  moveEntryInThreadCommandSchema,
  parseIdList,
  parseLineList,
  parseNameList,
  parseOptionalDate,
  parseOptionalNumber,
  parseOptionalString,
  privacyLevelSchema,
  promoteEntryToQuestionCommandSchema,
  recordStatusSchema,
  sourceSortOptions,
  sourceTypeSchema,
  titleFromBody,
  updateDecisionStatusCommandSchema,
  updateEntryCommandSchema,
  updateProjectCommandSchema,
  updateQuestionCommandSchema,
  updateSourceCommandSchema,
  updateTaskStatusCommandSchema,
  updateThemeCommandSchema,
  type BundleSelection,
  type DecisionStatus,
  type QuestionStatus
} from "@/domain/context";
import type {
  DecisionRepository,
  EntryRepository,
  FilterRepository,
  QuestionRepository,
  SnapshotRepository,
  SourceRecord,
  SourceRepository,
  TaskRepository,
  TaxonomyRepository,
  ThreadRepository
} from "@/repositories/context-repository";
import type { MutationState } from "./action-states";

export type { MutationState } from "./action-states";
export { initialMutationState } from "./action-states";

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
    privacyLevel: parseOptionalString(formStr(formData, "privacyLevel")),
    summary: parseOptionalString(formStr(formData, "summary"))
  });
}

export function parsePromoteEntryToQuestion(id: string) {
  return promoteEntryToQuestionCommandSchema.safeParse({ id });
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

export function parseUpdateThemeFormData(id: string, formData: FormData) {
  return updateThemeCommandSchema.safeParse({
    id,
    name: parseOptionalString(formStr(formData, "name")),
    description: parseOptionalString(formStr(formData, "description"))
  });
}

export function parseMergeThemeFormData(sourceThemeId: string, formData: FormData) {
  return mergeThemeCommandSchema.safeParse({
    sourceThemeId,
    targetThemeId: parseOptionalString(formStr(formData, "targetThemeId"))
  });
}

export function parseUpdateProjectFormData(id: string, formData: FormData) {
  return updateProjectCommandSchema.safeParse({
    id,
    name: parseOptionalString(formStr(formData, "name")),
    description: parseOptionalString(formStr(formData, "description")),
    status: parseOptionalString(formStr(formData, "status"))
  });
}

export function parseAddEntryToThreadFormData(threadId: string, formData: FormData) {
  return addEntryToThreadCommandSchema.safeParse({
    threadId,
    entryId: parseOptionalString(formStr(formData, "entryId"))
  });
}

export function parseMoveEntryInThreadFormData(threadId: string, entryId: string, direction: string) {
  return moveEntryInThreadCommandSchema.safeParse({ threadId, entryId, direction });
}

export function parseCreateDecisionFormData(questionId: string, formData: FormData) {
  return createDecisionCommandSchema.safeParse({
    questionId,
    decisionText: parseOptionalString(formStr(formData, "decisionText")),
    status: parseOptionalString(formStr(formData, "status")) ?? "proposed",
    decidedAt: parseOptionalDate(formStr(formData, "decidedAt")),
    supersedesDecisionId: parseOptionalString(formStr(formData, "supersedesDecisionId"))
  });
}

export function parseUpdateDecisionStatusFormData(id: string, formData: FormData) {
  return updateDecisionStatusCommandSchema.safeParse({
    id,
    status: parseOptionalString(formStr(formData, "status"))
  });
}

export function parseCreateTaskFormData(questionId: string, formData: FormData) {
  return createTaskCommandSchema.safeParse({
    questionId,
    decisionId: parseOptionalString(formStr(formData, "decisionId")),
    nextAction: parseOptionalString(formStr(formData, "nextAction")),
    status: parseOptionalString(formStr(formData, "status")) ?? "open",
    dueAt: parseOptionalDate(formStr(formData, "dueAt"))
  });
}

export function parseUpdateTaskStatusFormData(id: string, formData: FormData) {
  return updateTaskStatusCommandSchema.safeParse({
    id,
    status: parseOptionalString(formStr(formData, "status"))
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
    if (isDatabaseUnavailable(error)) {
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

export async function validateQuestionClosing(
  questionId: string,
  status: QuestionStatus,
  repository: DecisionRepository
): Promise<string | null> {
  if (!isQuestionClosingStatus(status)) {
    return null;
  }

  const decisions = await repository.listDecisionsForQuestion(questionId);
  return decisions.length === 0
    ? "A question cannot be closed without a decision (or mark it as abandoned)."
    : null;
}

export async function updateQuestionFromForm(
  id: string,
  formData: FormData,
  repository: QuestionRepository & DecisionRepository
) {
  const parsed = parseUpdateQuestionFormData(id, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the highlighted fields.", parsed.error) };
  }

  const closingError = await validateQuestionClosing(id, parsed.data.status, repository);
  if (closingError) {
    return { ok: false as const, state: { status: "error" as const, message: closingError } };
  }

  return withDbErrorHandling(async () => {
    const question = await repository.updateQuestion(parsed.data);
    return { ok: true as const, question };
  });
}

export async function createDecisionFromForm(questionId: string, formData: FormData, repository: DecisionRepository) {
  const parsed = parseCreateDecisionFormData(questionId, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the decision fields.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const decision = await repository.createDecision(parsed.data);
    return { ok: true as const, decision };
  });
}

export async function updateDecisionStatusFromForm(
  id: string,
  currentStatus: DecisionStatus,
  formData: FormData,
  repository: DecisionRepository
) {
  const parsed = parseUpdateDecisionStatusFormData(id, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the decision status.", parsed.error) };
  }

  if (!isValidDecisionStatusTransition(currentStatus, parsed.data.status)) {
    return {
      ok: false as const,
      state: { status: "error" as const, message: `Cannot change status from "${currentStatus}" to "${parsed.data.status}".` }
    };
  }

  return withDbErrorHandling(async () => {
    const decision = await repository.updateDecisionStatus(parsed.data);
    return { ok: true as const, decision };
  });
}

export async function createTaskFromForm(questionId: string, formData: FormData, repository: TaskRepository) {
  const parsed = parseCreateTaskFormData(questionId, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the task fields.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const task = await repository.createTask(parsed.data);
    return { ok: true as const, task };
  });
}

export async function updateTaskStatusFromForm(id: string, formData: FormData, repository: TaskRepository) {
  const parsed = parseUpdateTaskStatusFormData(id, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the task status.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const task = await repository.updateTaskStatus(parsed.data);
    return { ok: true as const, task };
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

export async function updateThemeFromForm(id: string, formData: FormData, repository: TaxonomyRepository) {
  const parsed = parseUpdateThemeFormData(id, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the highlighted fields.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const theme = await repository.updateTheme(parsed.data);
    return { ok: true as const, theme };
  });
}

export async function mergeThemesFromForm(sourceThemeId: string, formData: FormData, repository: TaxonomyRepository) {
  const parsed = parseMergeThemeFormData(sourceThemeId, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Choose a target theme.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const theme = await repository.mergeThemes(parsed.data);
    return { ok: true as const, theme };
  });
}

export async function updateProjectFromForm(id: string, formData: FormData, repository: TaxonomyRepository) {
  const parsed = parseUpdateProjectFormData(id, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Check the highlighted fields.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    const project = await repository.updateProject(parsed.data);
    return { ok: true as const, project };
  });
}

export async function addEntryToThreadFromForm(threadId: string, formData: FormData, repository: ThreadRepository) {
  const parsed = parseAddEntryToThreadFormData(threadId, formData);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Choose an entry to add.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    await repository.addEntryToThread(parsed.data);
    return { ok: true as const };
  });
}

export async function moveEntryInThread(
  threadId: string,
  entryId: string,
  direction: string,
  repository: ThreadRepository
) {
  const parsed = parseMoveEntryInThreadFormData(threadId, entryId, direction);

  if (!parsed.success) {
    return { ok: false as const, state: errorState("Could not move the entry.", parsed.error) };
  }

  return withDbErrorHandling(async () => {
    await repository.moveEntryInThread(parsed.data);
    return { ok: true as const };
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

function parseNewReferenceUrls(formData: FormData): { title: string; url: string }[] {
  const titles = formData.getAll("newRefTitle");
  const urls = formData.getAll("newRefUrl");
  const result: { title: string; url: string }[] = [];
  for (let i = 0; i < urls.length; i++) {
    const url = typeof urls[i] === "string" ? (urls[i] as string).trim() : "";
    if (!url) continue;
    try {
      new URL(url);
      const title = (typeof titles[i] === "string" ? (titles[i] as string).trim() : "") || url;
      result.push({ title, url });
    } catch { /* invalid URL — skip */ }
  }
  return result;
}

export function parseCreateSourceFormData(formData: FormData) {
  const type = parseOptionalString(formStr(formData, "type")) ?? "";
  return createSourceCommandSchema.safeParse({
    type,
    title: parseOptionalString(formStr(formData, "title")),
    description: parseOptionalString(formStr(formData, "description")),
    body: parseOptionalString(formStr(formData, "body")),
    status: parseOptionalString(formStr(formData, "status")) ?? "active",
    privacyLevel: parseOptionalString(formStr(formData, "privacyLevel")) ?? "private",
    metadata: buildRawSourceMetadata(type, formData),
    themeIds: formData.getAll("themeIds").filter((v): v is string => typeof v === "string" && v.trim().length > 0),
    referenceIds: formData.getAll("referenceId").filter((v): v is string => typeof v === "string" && v.trim().length > 0),
    newReferenceUrls: parseNewReferenceUrls(formData)
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
    privacyLevel: parseOptionalString(formStr(formData, "privacyLevel")),
    metadata: buildRawSourceMetadata(type, formData),
    themeIds: formData.getAll("themeIds").filter((v): v is string => typeof v === "string" && v.trim().length > 0),
    referenceIds: formData.getAll("referenceId").filter((v): v is string => typeof v === "string" && v.trim().length > 0),
    newReferenceUrls: parseNewReferenceUrls(formData)
  });
}

// Conversation sources are imported transcripts (read-only content): title,
// description, body, and metadata must never change after import, only
// status/themes/references can. The form never renders editable inputs for
// the read-only fields, but this also re-asserts it server-side by ignoring
// whatever the form sent for them and reusing the stored record instead.
export function parseUpdateConversationSourceFormData(id: string, existing: SourceRecord, formData: FormData) {
  return updateSourceCommandSchema.safeParse({
    id,
    title: existing.title,
    description: existing.description,
    body: existing.body,
    status: parseOptionalString(formStr(formData, "status")) ?? existing.status,
    privacyLevel: parseOptionalString(formStr(formData, "privacyLevel")) ?? existing.privacyLevel,
    metadata: existing.metadata,
    themeIds: formData.getAll("themeIds").filter((v): v is string => typeof v === "string" && v.trim().length > 0),
    referenceIds: formData.getAll("referenceId").filter((v): v is string => typeof v === "string" && v.trim().length > 0),
    newReferenceUrls: parseNewReferenceUrls(formData)
  });
}

export function makeSourceErrorState(error: z.ZodError): MutationState {
  return sourceErrorState("Check the highlighted fields.", error);
}

export async function captureSource(
  command: z.infer<typeof createSourceCommandSchema>,
  repository: SourceRepository
) {
  return withDbErrorHandling(async () => {
    const source = await repository.createSource(command);
    return { ok: true as const, source };
  });
}

export async function updateSource(
  command: z.infer<typeof updateSourceCommandSchema>,
  repository: SourceRepository
) {
  return withDbErrorHandling(async () => {
    const source = await repository.updateSource(command);
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
  status: recordStatusSchema.optional().catch(undefined),
  privacyLevel: privacyLevelSchema.optional().catch(undefined),
  sort: z.enum(sourceSortOptions).optional().catch(undefined)
});

export const SOURCES_PAGE_SIZE = 60;

export async function listSources(repository: SourceRepository, params?: Record<string, string | undefined>) {
  const page = Math.max(1, Math.trunc(parseOptionalNumber(params?.["page"] ?? null) ?? 1));

  const parsed = laxListSourcesQuerySchema.parse({
    search: parseOptionalString(params?.["search"] ?? null),
    type: parseOptionalString(params?.["type"] ?? null),
    themeSlug: parseOptionalString(params?.["themeSlug"] ?? null),
    // Default to active-only so archived sources (e.g. after conversation
    // mining is done) drop out of the main list/search without deleting them.
    // An explicit ?status= still overrides this.
    status: parseOptionalString(params?.["status"] ?? null) ?? "active",
    privacyLevel: parseOptionalString(params?.["privacyLevel"] ?? null),
    sort: parseOptionalString(params?.["sort"] ?? null),
    limit: SOURCES_PAGE_SIZE,
    offset: (page - 1) * SOURCES_PAGE_SIZE
  });

  const { items, total, searchCapped } = await repository.listSourcesWithTotal(parsed);

  return { items, total, page, pageSize: SOURCES_PAGE_SIZE, searchCapped };
}

const laxListEntriesQuerySchema = listEntriesQuerySchema.extend({
  type: entryTypeSchema.optional().catch(undefined),
  status: recordStatusSchema.optional().catch(undefined),
  privacyLevel: privacyLevelSchema.optional().catch(undefined)
});

export async function listEntries(repository: EntryRepository, params?: Record<string, string | undefined>) {
  const parsed = laxListEntriesQuerySchema.parse({
    search: parseOptionalString(params?.["search"] ?? null),
    type: parseOptionalString(params?.["type"] ?? null),
    status: parseOptionalString(params?.["status"] ?? null),
    privacyLevel: parseOptionalString(params?.["privacyLevel"] ?? null),
    themeSlug: parseOptionalString(params?.["themeSlug"] ?? null),
    projectSlug: parseOptionalString(params?.["projectSlug"] ?? null),
    questionId: parseOptionalString(params?.["questionId"] ?? null),
    occurredFrom: parseOptionalDate(params?.["occurredFrom"] ?? null),
    occurredTo: parseOptionalDate(params?.["occurredTo"] ?? null),
    limit: 100
  });

  return repository.listEntries(parsed);
}

export async function rebuildMirror(repository?: SnapshotRepository) {
  const snapshot = await (repository ?? createPrismaContextRepository()).getContextMirrorSnapshot();
  const build = buildContextMirror(snapshot, new Date());
  return writeContextMirror(build);
}

export async function generateContextBundle(
  selection: BundleSelection,
  repository?: SnapshotRepository
): Promise<GeneratedBundle> {
  const snapshot = await (repository ?? createPrismaContextRepository()).getContextMirrorSnapshot();
  return generateBundle(snapshot, {
    scope: "manual",
    purpose: "Manual bundle export from the Command Center",
    privacyFloor: selection.privacyFloor,
    selection
  });
}
