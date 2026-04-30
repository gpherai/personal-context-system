import { z } from "zod";

export const entryTypes = [
  "observation",
  "question",
  "insight",
  "suspicion",
  "reflection",
  "open_loop",
  "decision",
  "project_note",
  "media_note",
  "event_reflection",
  "practice_note",
  "ai_conversation_note"
] as const;

export const entryStatuses = ["active", "archived", "draft"] as const;
export const privacyLevels = ["private", "sensitive", "shareable"] as const;
export const recordStatuses = ["active", "archived"] as const;
export const questionStatuses = ["open", "active", "parked", "answered", "reframed", "abandoned"] as const;
export const objectTypes = ["entry", "theme", "project", "question", "thread", "reference", "attachment"] as const;
export const referenceKinds = ["url", "book", "article", "film", "game", "repository", "external_record", "other"] as const;
export const relationTypes = [
  "relates_to",
  "mentions",
  "expands",
  "contradicts",
  "supports",
  "questions",
  "answers",
  "reframes",
  "part_of",
  "inspired_by",
  "external_reference"
] as const;

export type EntryType = (typeof entryTypes)[number];
export type EntryStatus = (typeof entryStatuses)[number];
export type PrivacyLevel = (typeof privacyLevels)[number];
export type RecordStatus = (typeof recordStatuses)[number];
export type QuestionStatus = (typeof questionStatuses)[number];
export type ObjectType = (typeof objectTypes)[number];
export type ReferenceKind = (typeof referenceKinds)[number];
export type RelationType = (typeof relationTypes)[number];

export const entryTypeSchema = z.enum(entryTypes);
export const entryStatusSchema = z.enum(entryStatuses);
export const privacyLevelSchema = z.enum(privacyLevels);
export const recordStatusSchema = z.enum(recordStatuses);
export const questionStatusSchema = z.enum(questionStatuses);
export const objectTypeSchema = z.enum(objectTypes);
export const referenceKindSchema = z.enum(referenceKinds);
export const relationTypeSchema = z.enum(relationTypes);

export const metadataSchema = z.record(z.string(), z.unknown());

export const createEntryCommandSchema = z.object({
  type: entryTypeSchema.default("observation"),
  status: entryStatusSchema.default("active"),
  title: z.string().trim().min(1, "Title is required").max(240),
  body: z.string().trim().min(1, "Body is required"),
  summary: z.string().trim().max(4000).optional(),
  source: z.string().trim().max(240).optional(),
  confidence: z.number().min(0).max(1).optional(),
  privacyLevel: privacyLevelSchema.default("private"),
  occurredAt: z.date().optional(),
  metadata: metadataSchema.default({}),
  themeNames: z.array(z.string().trim().min(1).max(160)).default([]),
  projectNames: z.array(z.string().trim().min(1).max(180)).default([])
});

export const listEntriesQuerySchema = z.object({
  search: z.string().trim().optional(),
  type: entryTypeSchema.optional(),
  status: entryStatusSchema.optional(),
  privacyLevel: privacyLevelSchema.optional(),
  themeSlug: z.string().trim().optional(),
  projectSlug: z.string().trim().optional(),
  questionId: z.string().trim().optional(),
  occurredFrom: z.date().optional(),
  occurredTo: z.date().optional(),
  limit: z.number().int().min(1).max(200).default(50)
});

export const savedFilterParamsSchema = z
  .object({
    search: z.string().trim().max(240).optional(),
    type: entryTypeSchema.optional(),
    status: entryStatusSchema.optional(),
    privacyLevel: privacyLevelSchema.optional(),
    themeSlug: z.string().trim().max(120).optional(),
    projectSlug: z.string().trim().max(120).optional(),
    questionId: z.string().trim().max(120).optional(),
    occurredFrom: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    occurredTo: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  })
  .strict();

export const createSavedFilterCommandSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional(),
  params: savedFilterParamsSchema.default({})
});

export const updateEntryCommandSchema = createEntryCommandSchema.omit({ metadata: true }).extend({
  id: z.string().min(1),
  metadata: metadataSchema.optional()
});

export const updateQuestionCommandSchema = z.object({
  id: z.string().min(1),
  status: questionStatusSchema,
  summary: z.string().trim().max(4000).optional()
});

export const linkObjectsCommandSchema = z.object({
  fromType: objectTypeSchema,
  fromId: z.string().min(1),
  toType: objectTypeSchema,
  toId: z.string().min(1),
  relationType: relationTypeSchema,
  note: z.string().trim().max(2000).optional()
});

export const createReferenceCommandSchema = z.object({
  entryId: z.string().min(1),
  kind: referenceKindSchema.default("url"),
  title: z.string().trim().min(1, "Title is required").max(220),
  url: z.string().trim().max(4000).optional(),
  description: z.string().trim().max(4000).optional(),
  metadata: metadataSchema.default({})
});

export const createAttachmentCommandSchema = z.object({
  entryId: z.string().min(1),
  path: z.string().trim().min(1, "Path is required").max(4000),
  mediaType: z.string().trim().max(160).optional(),
  checksum: z.string().trim().max(128).optional(),
  sizeBytes: z.number().int().min(0).optional(),
  title: z.string().trim().max(220).optional(),
  description: z.string().trim().max(4000).optional(),
  metadata: metadataSchema.default({})
});

export const createThreadCommandSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(180),
  description: z.string().trim().max(4000).optional(),
  status: recordStatusSchema.default("active"),
  entryIds: z.array(z.string().trim().min(1)).default([]),
  metadata: metadataSchema.default({})
});

export type CreateEntryCommand = z.infer<typeof createEntryCommandSchema>;
export type ListEntriesQuery = z.infer<typeof listEntriesQuerySchema>;
export type SavedFilterParams = z.infer<typeof savedFilterParamsSchema>;
export type CreateSavedFilterCommand = z.infer<typeof createSavedFilterCommandSchema>;
export type UpdateEntryCommand = z.infer<typeof updateEntryCommandSchema>;
export type UpdateQuestionCommand = z.infer<typeof updateQuestionCommandSchema>;
export type LinkObjectsCommand = z.infer<typeof linkObjectsCommandSchema>;
export type CreateReferenceCommand = z.infer<typeof createReferenceCommandSchema>;
export type CreateAttachmentCommand = z.infer<typeof createAttachmentCommandSchema>;
export type CreateThreadCommand = z.infer<typeof createThreadCommandSchema>;

export function slugifyName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function parseNameList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") {
    return [];
  }

  const seen = new Set<string>();

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => {
      if (!item) {
        return false;
      }

      const key = item.toLowerCase();
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

export function parseIdList(value: FormDataEntryValue | null): string[] {
  return parseNameList(value);
}

export function parseOptionalString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseOptionalDate(value: FormDataEntryValue | null): Date | undefined {
  const text = parseOptionalString(value);
  if (!text) {
    return undefined;
  }

  const date = new Date(`${text}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function parseOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  const text = parseOptionalString(value);
  if (!text) {
    return undefined;
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function titleFromBody(body: string): string {
  const firstLine = body
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine?.slice(0, 120) || "Untitled entry";
}
