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
export type RelationType = (typeof relationTypes)[number];

export const entryTypeSchema = z.enum(entryTypes);
export const entryStatusSchema = z.enum(entryStatuses);
export const privacyLevelSchema = z.enum(privacyLevels);
export const questionStatusSchema = z.enum(questionStatuses);
export const objectTypeSchema = z.enum(objectTypes);
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
  limit: z.number().int().min(1).max(200).default(50)
});

export const linkObjectsCommandSchema = z.object({
  fromType: objectTypeSchema,
  fromId: z.string().min(1),
  toType: objectTypeSchema,
  toId: z.string().min(1),
  relationType: relationTypeSchema,
  note: z.string().trim().max(2000).optional()
});

export type CreateEntryCommand = z.infer<typeof createEntryCommandSchema>;
export type ListEntriesQuery = z.infer<typeof listEntriesQuerySchema>;
export type LinkObjectsCommand = z.infer<typeof linkObjectsCommandSchema>;

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
