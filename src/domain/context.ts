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
export const objectTypes = ["entry", "theme", "project", "question", "thread", "reference", "attachment", "source"] as const;
export const sourceTypes = ["video", "book", "post", "image", "sadhana", "upadesha", "stotra", "deity_concept"] as const;
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
export type SourceType = (typeof sourceTypes)[number];
export type ReferenceKind = (typeof referenceKinds)[number];
export type RelationType = (typeof relationTypes)[number];

export const entryTypeSchema = z.enum(entryTypes);
export const entryStatusSchema = z.enum(entryStatuses);
export const privacyLevelSchema = z.enum(privacyLevels);
export const recordStatusSchema = z.enum(recordStatuses);
export const questionStatusSchema = z.enum(questionStatuses);
export const objectTypeSchema = z.enum(objectTypes);
export const sourceTypeSchema = z.enum(sourceTypes);
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

export const updateEntryCommandSchema = createEntryCommandSchema.omit({ metadata: true, type: true }).extend({
  id: z.string().min(1),
  metadata: metadataSchema.optional()
});

export const updateQuestionCommandSchema = z.object({
  id: z.string().min(1),
  status: questionStatusSchema,
  summary: z.string().trim().max(4000).optional()
});

export const promoteEntryToQuestionCommandSchema = z.object({
  id: z.string().min(1)
});

export const linkObjectsCommandSchema = z
  .object({
    fromType: objectTypeSchema,
    fromId: z.string().min(1),
    toType: objectTypeSchema,
    toId: z.string().min(1),
    relationType: relationTypeSchema,
    note: z.string().trim().max(2000).optional()
  })
  .superRefine((val, ctx) => {
    if (val.fromType === val.toType && val.fromId === val.toId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toId"],
        message: "Cannot link an object to itself"
      });
    }
  });

export const createReferenceCommandSchema = z
  .object({
    entryId: z.string().min(1),
    kind: referenceKindSchema.default("url"),
    title: z.string().trim().min(1, "Title is required").max(220),
    url: z.string().trim().max(4000).optional(),
    description: z.string().trim().max(4000).optional(),
    metadata: metadataSchema.default({})
  })
  .superRefine((val, ctx) => {
    if (val.kind === "url" && val.url) {
      try {
        new URL(val.url);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["url"],
          message: "Must be a valid URL"
        });
      }
    }
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

const videoMetadataSchema = z.object({
  type: z.literal("video"),
  url: z.string().trim().url().optional(),
  duration: z.number().int().min(0).optional(),
  channel: z.string().trim().max(240).optional(),
  language: z.string().trim().max(40).optional()
});

const bookMetadataSchema = z.object({
  type: z.literal("book"),
  authors: z.array(z.string().trim().min(1).max(240)).default([]),
  isbn: z.string().trim().max(20).optional(),
  year: z.number().int().min(0).max(2200).optional(),
  publisher: z.string().trim().max(240).optional(),
  language: z.string().trim().max(40).optional()
});

const postMetadataSchema = z.object({
  type: z.literal("post"),
  url: z.string().trim().url().optional(),
  author: z.string().trim().max(240).optional(),
  publishedAt: z.string().trim().optional()
});

const imageMetadataSchema = z.object({
  type: z.literal("image"),
  url: z.string().trim().url().optional(),
  alt: z.string().trim().max(500).optional(),
  photographer: z.string().trim().max(240).optional()
});

const sadhanaMetadataSchema = z.object({
  type: z.literal("sadhana"),
  tradition: z.string().trim().max(240).optional(),
  deity: z.string().trim().max(240).optional(),
  language: z.string().trim().max(40).optional(),
  format: z.enum(["text", "audio", "video"]).optional()
});

const upadeshaMetadataSchema = z.object({
  type: z.literal("upadesha"),
  teacher: z.string().trim().max(240).optional(),
  tradition: z.string().trim().max(240).optional(),
  language: z.string().trim().max(40).optional(),
  format: z.enum(["text", "audio", "video"]).optional()
});

const stotraMetadataSchema = z.object({
  type: z.literal("stotra"),
  deity: z.string().trim().max(240).optional(),
  tradition: z.string().trim().max(240).optional(),
  language: z.string().trim().max(40).optional(),
  script: z.string().trim().max(80).optional()
});

const deityConceptMetadataSchema = z.object({
  type: z.literal("deity_concept"),
  tradition: z.string().trim().max(240).optional(),
  language: z.string().trim().max(40).optional(),
  aliases: z.array(z.string().trim().min(1).max(240)).default([])
});

export const sourceMetadataSchema = z.discriminatedUnion("type", [
  videoMetadataSchema,
  bookMetadataSchema,
  postMetadataSchema,
  imageMetadataSchema,
  sadhanaMetadataSchema,
  upadeshaMetadataSchema,
  stotraMetadataSchema,
  deityConceptMetadataSchema
]);

export type SourceMetadata = z.infer<typeof sourceMetadataSchema>;

const sourceCommandBaseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(320),
  description: z.string().trim().max(4000).optional(),
  status: recordStatusSchema.default("active"),
  metadata: sourceMetadataSchema,
  themeIds: z.array(z.string().trim().min(1)).default([])
});

export const createSourceCommandSchema = sourceCommandBaseSchema
  .extend({ type: sourceTypeSchema })
  .superRefine((val, ctx) => {
    if (val.type !== val.metadata.type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["metadata", "type"],
        message: `metadata.type "${val.metadata.type}" must match source type "${val.type}"`
      });
    }
  });

// metadata.type must match the stored source type (immutable after creation).
// Schema cannot enforce this without DB access — infra layer must validate.
export const updateSourceCommandSchema = sourceCommandBaseSchema.extend({
  id: z.string().min(1)
});

export const listSourcesQuerySchema = z.object({
  search: z.string().trim().optional(),
  type: sourceTypeSchema.optional(),
  themeId: z.string().trim().optional(),
  status: recordStatusSchema.optional(),
  limit: z.number().int().min(1).max(200).default(50)
});

export function metadataToSearchText(metadata: SourceMetadata): string {
  const parts: string[] = [];

  const push = (...values: (string | undefined)[]) => {
    for (const v of values) {
      if (v) parts.push(v);
    }
  };

  switch (metadata.type) {
    case "video":
      push(metadata.channel, metadata.language);
      break;
    case "book":
      push(...metadata.authors, metadata.publisher, metadata.language, metadata.isbn);
      break;
    case "post":
      push(metadata.author, metadata.publishedAt);
      break;
    case "image":
      push(metadata.alt, metadata.photographer);
      break;
    case "sadhana":
      push(metadata.tradition, metadata.deity, metadata.language, metadata.format);
      break;
    case "upadesha":
      push(metadata.teacher, metadata.tradition, metadata.language, metadata.format);
      break;
    case "stotra":
      push(metadata.deity, metadata.tradition, metadata.language, metadata.script);
      break;
    case "deity_concept":
      push(metadata.tradition, metadata.language, ...metadata.aliases);
      break;
  }

  return parts.join(" ");
}

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
export type PromoteEntryToQuestionCommand = z.infer<typeof promoteEntryToQuestionCommandSchema>;
export type LinkObjectsCommand = z.infer<typeof linkObjectsCommandSchema>;
export type CreateReferenceCommand = z.infer<typeof createReferenceCommandSchema>;
export type CreateAttachmentCommand = z.infer<typeof createAttachmentCommandSchema>;
export type CreateThreadCommand = z.infer<typeof createThreadCommandSchema>;
export type CreateSourceCommand = z.infer<typeof createSourceCommandSchema>;
export type UpdateSourceCommand = z.infer<typeof updateSourceCommandSchema>;
export type ListSourcesQuery = z.infer<typeof listSourcesQuerySchema>;

export function slugifyName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/, "");
}

export function parseNameList(value: string | null | undefined): string[] {
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

export function parseIdList(value: string | null | undefined): string[] {
  return parseNameList(value);
}

export function parseOptionalString(value: string | null | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseOptionalDate(value: string | null | undefined): Date | undefined {
  const text = parseOptionalString(value);
  if (!text) {
    return undefined;
  }

  const date = new Date(`${text}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  // Reject calendar overflow (e.g. 2026-02-31 rolls to March in JS)
  const [y, m, d] = text.split("-").map(Number);
  if (date.getUTCFullYear() !== y || date.getUTCMonth() + 1 !== m || date.getUTCDate() !== d) {
    return undefined;
  }

  return date;
}

export function parseOptionalNumber(value: string | null | undefined): number | undefined {
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
