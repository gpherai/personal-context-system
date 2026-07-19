import "server-only";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";

import {
  entryStatuses,
  entryTypes,
  excerptTextIsQuoted,
  metadataToSearchText,
  sourceTypes,
  savedFilterParamsSchema,
  slugifyName,
  sourceMetadataSchema,
  type SourceType,
  type CreateAttachmentCommand,
  type CreateDecisionCommand,
  type CreateEntryCommand,
  type CreateExcerptCommand,
  type CreateQuestionCommand,
  type CreateReferenceCommand,
  type CreateSavedFilterCommand,
  type CreateSourceCommand,
  type CreateTaskCommand,
  type CreateThreadCommand,
  type AddEntryToThreadCommand,
  type ListEntriesQuery,
  type ListQuestionsQuery,
  type ListSourcesQuery,
  type MergeThemeCommand,
  type MoveEntryInThreadCommand,
  type PromoteEntryToQuestionCommand,
  type RecordStatus,
  type UpdateDecisionStatusCommand,
  type UpdateEntryCommand,
  type UpdateProjectCommand,
  type UpdateQuestionCommand,
  type UpdateSourceCommand,
  type UpdateTaskStatusCommand,
  type UpdateThemeCommand
} from "@/domain/context";
import type {
  AttachmentRecord,
  CabinetOverview,
  ContextMirrorSnapshot,
  ContextRepository,
  DashboardHome,
  DashboardOverview,
  DecisionRecord,
  EntryListItem,
  EntryRecord,
  ExcerptRecord,
  GraphSnapshot,
  JsonObject,
  NamedRecord,
  NamedRecordContext,
  QuestionContext,
  QuestionRecord,
  ReferenceRecord,
  SavedFilterRecord,
  SourceListResult,
  SourceMessageRecord,
  SourceRecord,
  SourceSummary,
  TaskRecord,
  ThreadRecord
} from "@/repositories/context-repository";

import { DatabaseUnavailableError } from "@/application/errors";
import { getPrismaClient } from "./client";

// Ranked-candidate cap for Source full-text search: how many rows the raw
// tsvector/ts_rank query considers before type/status/theme filtering and
// pagination. Matches between findSourceSearchIds and listSourcesWithTotal.
const SOURCE_SEARCH_CANDIDATE_LIMIT = 200;

const entryInclude = {
  themes: {
    include: {
      theme: true
    }
  },
  projects: {
    include: {
      project: true
    }
  },
  questions: {
    include: {
      question: true
    }
  },
  threads: {
    include: {
      thread: true
    }
  },
  references: {
    include: {
      reference: true
    }
  },
  attachments: {
    include: {
      attachment: true
    }
  },
  sources: {
    include: {
      source: {
        select: { id: true, type: true, title: true }
      }
    }
  },
  excerpts: {
    include: {
      excerpt: {
        include: {
          source: { select: { id: true, title: true } }
        }
      }
    }
  }
} satisfies Prisma.EntryInclude;

type EntryWithRelations = Prisma.EntryGetPayload<{
  include: typeof entryInclude;
}>;

const entryListSelect = {
  id: true,
  type: true,
  status: true,
  title: true,
  body: true,
  summary: true,
  privacyLevel: true,
  occurredAt: true,
  capturedAt: true,
  themes: {
    select: {
      theme: {
        select: { id: true, slug: true, name: true }
      }
    }
  },
  projects: {
    select: {
      project: {
        select: { id: true, slug: true, name: true }
      }
    }
  }
} satisfies Prisma.EntrySelect;

type EntryListRow = Prisma.EntryGetPayload<{ select: typeof entryListSelect }>;

const sourceInclude = {
  themes: {
    include: {
      theme: true
    }
  },
  entries: {
    include: {
      entry: {
        select: { id: true, title: true }
      }
    }
  },
  references: {
    include: {
      reference: true
    }
  }
} satisfies Prisma.SourceInclude;

type SourceWithRelations = Prisma.SourceGetPayload<{
  include: typeof sourceInclude;
}>;

function mapSourceSummary(source: SourceWithRelations): SourceSummary | null {
  const metadataParsed = sourceMetadataSchema.safeParse(asRecord(source.metadata));
  if (!metadataParsed.success) {
    console.warn(`[mapSourceSummary] invalid metadata on source ${source.id}, skipping:`, metadataParsed.error.message);
    return null;
  }
  return {
    id: source.id,
    type: source.type,
    title: source.title,
    description: optional(source.description),
    body: optional(source.body),
    status: source.status,
    privacyLevel: source.privacyLevel,
    metadata: metadataParsed.data,
    themes: source.themes
      .map(({ theme }) => ({ id: theme.id, slug: theme.slug, name: theme.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    references: source.references
      .map(({ reference }) => mapReference(reference))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    createdAt: source.createdAt,
    updatedAt: source.updatedAt
  };
}

function mapSource(
  source: SourceWithRelations & {
    messages?: { id: string; position: number; role: string; text: string; model: string | null; occurredAt: Date | null }[];
    excerpts?: {
      id: string;
      sourceId: string;
      messageId: string | null;
      text: string;
      note: string | null;
      createdAt: Date;
      entries: { entry: { id: string; title: string } }[];
    }[];
  }
): SourceRecord | null {
  const summary = mapSourceSummary(source);
  if (!summary) return null;
  return {
    ...summary,
    entries: source.entries
      .map(({ entry }) => ({ id: entry.id, title: entry.title }))
      .sort((a, b) => a.title.localeCompare(b.title)),
    messages: (source.messages ?? []).map(
      (m): SourceMessageRecord => ({
        id: m.id,
        position: m.position,
        role: m.role,
        text: m.text,
        model: optional(m.model),
        occurredAt: optional(m.occurredAt)
      })
    ),
    excerpts: (source.excerpts ?? []).map(
      (e): ExcerptRecord => ({
        id: e.id,
        sourceId: e.sourceId,
        messageId: optional(e.messageId),
        text: e.text,
        note: optional(e.note),
        createdAt: e.createdAt,
        entries: e.entries.map(({ entry }) => ({ id: entry.id, title: entry.title }))
      })
    )
  };
}

function asRecord(value: unknown): JsonObject {
  if (value === null || value === undefined) {
    return {};
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }

  throw new Error(`Expected JSON object, got ${Array.isArray(value) ? "array" : typeof value}`);
}

function optional<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

function mapReference(reference: {
  id: string;
  kind: ReferenceRecord["kind"];
  title: string;
  url: string | null;
  description: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ReferenceRecord {
  return {
    id: reference.id,
    kind: reference.kind,
    title: reference.title,
    url: optional(reference.url),
    description: optional(reference.description),
    metadata: asRecord(reference.metadata),
    createdAt: reference.createdAt,
    updatedAt: reference.updatedAt
  };
}

function mapAttachment(attachment: {
  id: string;
  path: string;
  mediaType: string | null;
  checksum: string | null;
  sizeBytes: bigint | null;
  title: string | null;
  description: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): AttachmentRecord {
  return {
    id: attachment.id,
    path: attachment.path,
    mediaType: optional(attachment.mediaType),
    checksum: optional(attachment.checksum),
    sizeBytes: attachment.sizeBytes?.toString(),
    title: optional(attachment.title),
    description: optional(attachment.description),
    metadata: asRecord(attachment.metadata),
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt
  };
}

function mapEntry(entry: EntryWithRelations): EntryRecord {
  return {
    id: entry.id,
    type: entry.type,
    status: entry.status,
    title: entry.title,
    body: entry.body,
    summary: optional(entry.summary),
    source: optional(entry.source),
    confidence: optional(entry.confidence),
    privacyLevel: entry.privacyLevel,
    occurredAt: optional(entry.occurredAt),
    capturedAt: entry.capturedAt,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    metadata: asRecord(entry.metadata),
    themes: entry.themes
      .map(({ theme }) => ({ id: theme.id, slug: theme.slug, name: theme.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    projects: entry.projects
      .map(({ project }) => ({ id: project.id, slug: project.slug, name: project.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    questions: entry.questions
      .map(({ question }) => ({ id: question.id, prompt: question.prompt, status: question.status }))
      .sort((a, b) => a.prompt.localeCompare(b.prompt)),
    threads: entry.threads
      .map(({ thread }) => ({ id: thread.id, slug: thread.slug, title: thread.title }))
      .sort((a, b) => a.title.localeCompare(b.title)),
    references: entry.references
      .map(({ reference }) => mapReference(reference))
      .sort((a, b) => a.title.localeCompare(b.title)),
    attachments: entry.attachments
      .map(({ attachment }) => mapAttachment(attachment))
      .sort((a, b) => (a.title ?? a.path).localeCompare(b.title ?? b.path)),
    sources: entry.sources
      .map(({ source }) => ({ id: source.id, type: source.type, title: source.title }))
      .sort((a, b) => a.title.localeCompare(b.title)),
    excerpts: entry.excerpts
      .map(({ excerpt }) => ({
        id: excerpt.id,
        text: excerpt.text,
        note: optional(excerpt.note),
        sourceId: excerpt.source.id,
        sourceTitle: excerpt.source.title
      }))
      .sort((a, b) => a.sourceTitle.localeCompare(b.sourceTitle))
  };
}

function mapEntryListItem(entry: EntryListRow): EntryListItem {
  return {
    id: entry.id,
    type: entry.type,
    status: entry.status,
    title: entry.title,
    body: entry.body,
    summary: optional(entry.summary),
    privacyLevel: entry.privacyLevel,
    occurredAt: optional(entry.occurredAt),
    capturedAt: entry.capturedAt,
    themes: entry.themes
      .map(({ theme }) => ({ id: theme.id, slug: theme.slug, name: theme.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    projects: entry.projects
      .map(({ project }) => ({ id: project.id, slug: project.slug, name: project.name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  };
}

function mapQuestion(question: {
  id: string;
  prompt: string;
  status: QuestionRecord["status"];
  privacyLevel: QuestionRecord["privacyLevel"];
  summary: string | null;
  originEntryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): QuestionRecord {
  return {
    id: question.id,
    prompt: question.prompt,
    status: question.status,
    privacyLevel: question.privacyLevel,
    summary: optional(question.summary),
    originEntryId: optional(question.originEntryId),
    createdAt: question.createdAt,
    updatedAt: question.updatedAt
  };
}

function mapDecision(decision: {
  id: string;
  questionId: string;
  decisionText: string;
  status: DecisionRecord["status"];
  decidedAt: Date | null;
  supersedesDecisionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): DecisionRecord {
  return {
    id: decision.id,
    questionId: decision.questionId,
    decisionText: decision.decisionText,
    status: decision.status,
    decidedAt: optional(decision.decidedAt),
    supersedesDecisionId: optional(decision.supersedesDecisionId),
    createdAt: decision.createdAt,
    updatedAt: decision.updatedAt
  };
}

function mapTask(task: {
  id: string;
  decisionId: string | null;
  questionId: string | null;
  status: TaskRecord["status"];
  dueAt: Date | null;
  nextAction: string;
  createdAt: Date;
  updatedAt: Date;
}): TaskRecord {
  return {
    id: task.id,
    decisionId: optional(task.decisionId),
    questionId: optional(task.questionId),
    status: task.status,
    dueAt: optional(task.dueAt),
    nextAction: task.nextAction,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

function mapNamed(record: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status?: RecordStatus;
  metadata?: unknown;
  _count?: { entries?: number };
}): NamedRecord {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: optional(record.description),
    status: record.status,
    entryCount: record._count?.entries,
    metadata: record.metadata ? asRecord(record.metadata) : undefined
  };
}

function mapThread(
  thread: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    status: ThreadRecord["status"];
    createdAt: Date;
    updatedAt: Date;
  },
  entries: EntryRecord[] = []
): ThreadRecord {
  return {
    id: thread.id,
    slug: thread.slug,
    title: thread.title,
    description: optional(thread.description),
    status: thread.status,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    entries
  };
}

function mapSavedFilter(filter: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  params: unknown;
  createdAt: Date;
  updatedAt: Date;
}): SavedFilterRecord {
  const parsedParams = savedFilterParamsSchema.safeParse(asRecord(filter.params));

  if (!parsedParams.success) {
    throw new Error(`Corrupt saved filter params for filter "${filter.id}": ${parsedParams.error.message}`);
  }

  return {
    id: filter.id,
    slug: filter.slug,
    name: filter.name,
    description: optional(filter.description),
    params: parsedParams.data,
    createdAt: filter.createdAt,
    updatedAt: filter.updatedAt
  };
}

function entryWhere(query?: ListEntriesQuery, searchIds?: string[]): Prisma.EntryWhereInput {
  const where: Prisma.EntryWhereInput = {};

  if (query?.type) {
    where.type = query.type;
  }

  if (query?.status) {
    where.status = query.status;
  }

  if (query?.privacyLevel) {
    where.privacyLevel = query.privacyLevel;
  }

  if (query?.themeSlug) {
    where.themes = { some: { theme: { slug: query.themeSlug } } };
  }

  if (query?.projectSlug) {
    where.projects = { some: { project: { slug: query.projectSlug } } };
  }

  if (query?.questionId) {
    where.questions = { some: { questionId: query.questionId } };
  }

  if (query?.occurredFrom || query?.occurredTo) {
    where.occurredAt = {
      ...(query.occurredFrom ? { gte: query.occurredFrom } : {}),
      ...(query.occurredTo ? { lte: query.occurredTo } : {})
    };
  }

  if (searchIds) {
    where.id = { in: searchIds };
  }

  return where;
}

export class PrismaContextRepository implements ContextRepository {
  constructor(private readonly prisma: PrismaClient = getPrismaClient()) {}

  private async searchEntryIds(search: string, limit: number): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "Entry"
      WHERE to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("summary", '') || ' ' || coalesce("body", ''))
        @@ plainto_tsquery('simple', ${search})
      ORDER BY ts_rank(
        to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("summary", '') || ' ' || coalesce("body", '')),
        plainto_tsquery('simple', ${search})
      ) DESC,
      "capturedAt" DESC
      LIMIT ${limit}
    `;

    return rows.map((row) => row.id);
  }

  private async syncEntryNames(tx: Prisma.TransactionClient, entryId: string, themeNames: string[], projectNames: string[]) {
    await tx.entryTheme.deleteMany({ where: { entryId } });
    await tx.entryProject.deleteMany({ where: { entryId } });

    // Upserts must stay per-row (each returns the generated id); the join rows
    // are then written in a single createMany batch.
    const seenThemeSlugs = new Set<string>();
    const themeIds: string[] = [];
    for (const name of themeNames) {
      const slug = slugifyName(name);
      if (!slug || seenThemeSlugs.has(slug)) continue;
      seenThemeSlugs.add(slug);

      const theme = await tx.theme.upsert({
        where: { slug },
        update: { name },
        create: { slug, name }
      });
      themeIds.push(theme.id);
    }
    if (themeIds.length > 0) {
      await tx.entryTheme.createMany({ data: themeIds.map((themeId) => ({ entryId, themeId })) });
    }

    const seenProjectSlugs = new Set<string>();
    const projectIds: string[] = [];
    for (const name of projectNames) {
      const slug = slugifyName(name);
      if (!slug || seenProjectSlugs.has(slug)) continue;
      seenProjectSlugs.add(slug);

      const project = await tx.project.upsert({
        where: { slug },
        update: { name },
        create: { slug, name }
      });
      projectIds.push(project.id);
    }
    if (projectIds.length > 0) {
      await tx.entryProject.createMany({ data: projectIds.map((projectId) => ({ entryId, projectId })) });
    }
  }

  private async syncEntryLinks(tx: Prisma.TransactionClient, entryId: string, sourceIds: string[], excerptIds: string[]) {
    await tx.entrySource.deleteMany({ where: { entryId } });
    await tx.entryExcerpt.deleteMany({ where: { entryId } });

    const uniqueSourceIds = [...new Set(sourceIds)];
    if (uniqueSourceIds.length > 0) {
      await tx.entrySource.createMany({ data: uniqueSourceIds.map((sourceId) => ({ entryId, sourceId })) });
    }

    const uniqueExcerptIds = [...new Set(excerptIds)];
    if (uniqueExcerptIds.length > 0) {
      await tx.entryExcerpt.createMany({ data: uniqueExcerptIds.map((excerptId) => ({ entryId, excerptId })) });
    }
  }

  private async retryOnSlugConflict<T>(baseSlug: string, createFn: (slug: string) => Promise<T>): Promise<T> {
    let suffix = 2;
    let slug = baseSlug;

    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        return await createFn(slug);
      } catch (err) {
        if ((err as { code?: string }).code === "P2002") {
          slug = `${baseSlug}-${suffix++}`;
          continue;
        }
        throw err;
      }
    }

    throw new Error(`Failed to generate unique slug after 10 attempts: ${baseSlug}`);
  }

  private async ensureOriginQuestion(
    tx: Prisma.TransactionClient,
    entry: { id: string; title: string; summary: string | null }
  ) {
    const existingQuestion = await tx.question.findUnique({
      where: { originEntryId: entry.id },
      select: { id: true }
    });

    const question = existingQuestion
      ? await tx.question.update({
          where: { id: existingQuestion.id },
          data: { prompt: entry.title }
        })
      : await tx.question.create({
          data: {
            prompt: entry.title,
            summary: entry.summary,
            originEntryId: entry.id,
            status: "open"
          }
        });

    await tx.entryQuestion.upsert({
      where: {
        entryId_questionId: {
          entryId: entry.id,
          questionId: question.id
        }
      },
      update: {},
      create: {
        entryId: entry.id,
        questionId: question.id
      }
    });

    return question;
  }

  async createEntry(command: CreateEntryCommand): Promise<EntryRecord> {
    const entry = await this.prisma.$transaction(async (tx) => {
      const created = await tx.entry.create({
        data: {
          type: command.type,
          status: command.status,
          title: command.title,
          body: command.body,
          summary: command.summary ?? null,
          source: command.source ?? null,
          confidence: command.confidence ?? null,
          privacyLevel: command.privacyLevel,
          occurredAt: command.occurredAt ?? null,
          metadata: command.metadata as Prisma.InputJsonValue
        }
      });

      await this.syncEntryNames(tx, created.id, command.themeNames, command.projectNames);
      await this.syncEntryLinks(tx, created.id, command.sourceIds, command.excerptIds);

      if (command.type === "question") {
        await this.ensureOriginQuestion(tx, created);
      }

      return tx.entry.findUniqueOrThrow({
        where: { id: created.id },
        include: entryInclude
      });
    });

    return mapEntry(entry);
  }

  async updateEntry(command: UpdateEntryCommand): Promise<EntryRecord> {
    const entry = await this.prisma.$transaction(async (tx) => {
      await tx.entry.update({
        where: { id: command.id },
        data: {
          status: command.status,
          title: command.title,
          body: command.body,
          summary: command.summary ?? null,
          source: command.source ?? null,
          confidence: command.confidence ?? null,
          privacyLevel: command.privacyLevel,
          occurredAt: command.occurredAt ?? null,
          ...(command.metadata !== undefined ? { metadata: command.metadata as Prisma.InputJsonValue } : {})
        }
      });

      await this.syncEntryNames(tx, command.id, command.themeNames, command.projectNames);
      await this.syncEntryLinks(tx, command.id, command.sourceIds, command.excerptIds);

      // Sync question prompt if this entry has an associated question (title may have changed)
      const linkedQuestion = await tx.question.findUnique({
        where: { originEntryId: command.id },
        select: { id: true }
      });
      if (linkedQuestion) {
        await tx.question.update({
          where: { id: linkedQuestion.id },
          data: { prompt: command.title }
        });
      }

      return tx.entry.findUniqueOrThrow({
        where: { id: command.id },
        include: entryInclude
      });
    });

    return mapEntry(entry);
  }

  async listEntries(query?: ListEntriesQuery): Promise<EntryListItem[]> {
    const limit = Math.min(query?.limit ?? 50, 200);
    // Fetch the full ranked candidate set (not pre-sliced to `limit`) so the
    // structured filters below apply across ALL matches. Slicing to `limit`
    // before filtering dropped relevant rows ranked past `limit`.
    const searchIds = query?.search ? await this.searchEntryIds(query.search, 200) : undefined;
    const entries = await this.prisma.entry.findMany({
      where: entryWhere(query, searchIds),
      select: entryListSelect,
      orderBy: [{ capturedAt: "desc" }, { createdAt: "desc" }],
      // When searching, apply `limit` after re-sorting by rank; otherwise limit in-query.
      take: searchIds ? undefined : limit
    });

    if (searchIds) {
      const rank = new Map(searchIds.map((id, i) => [id, i]));
      return entries
        .sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity))
        .slice(0, limit)
        .map(mapEntryListItem);
    }

    return entries.map(mapEntryListItem);
  }

  async getEntry(id: string): Promise<EntryRecord | null> {
    const entry = await this.prisma.entry.findUnique({
      where: { id },
      include: entryInclude
    });

    return entry ? mapEntry(entry) : null;
  }

  async deleteEntry(id: string): Promise<void> {
    await this.prisma.entry.delete({ where: { id } });
  }

  async getThemeBySlug(slug: string): Promise<NamedRecordContext | null> {
    const theme = await this.prisma.theme.findUnique({
      where: { slug },
      include: {
        entries: {
          include: {
            entry: {
              include: entryInclude
            }
          }
        },
        _count: { select: { entries: true } }
      }
    });

    if (!theme) {
      return null;
    }

    return {
      ...mapNamed(theme),
      entries: theme.entries.map(({ entry }) => mapEntry(entry))
    };
  }

  async deleteTheme(id: string): Promise<void> {
    const count = await this.prisma.entryTheme.count({ where: { themeId: id } });
    if (count > 0) throw new Error(`Theme still has ${count} linked ${count === 1 ? "entry" : "entries"}.`);
    await this.prisma.theme.delete({ where: { id } });
  }

  async deleteProject(id: string): Promise<void> {
    const count = await this.prisma.entryProject.count({ where: { projectId: id } });
    if (count > 0) throw new Error(`Project still has ${count} linked ${count === 1 ? "entry" : "entries"}.`);
    await this.prisma.project.delete({ where: { id } });
  }

  async updateTheme(command: UpdateThemeCommand): Promise<NamedRecord> {
    const theme = await this.prisma.theme.update({
      where: { id: command.id },
      data: { name: command.name, description: command.description },
      include: { _count: { select: { entries: true } } }
    });
    return mapNamed(theme);
  }

  async mergeThemes(command: MergeThemeCommand): Promise<NamedRecord> {
    const theme = await this.prisma.$transaction(async (tx) => {
      const [sourceLinks, sourceSourceLinks] = await Promise.all([
        tx.entryTheme.findMany({ where: { themeId: command.sourceThemeId } }),
        tx.sourceTheme.findMany({ where: { themeId: command.sourceThemeId } })
      ]);

      for (const link of sourceLinks) {
        await tx.entryTheme.upsert({
          where: { entryId_themeId: { entryId: link.entryId, themeId: command.targetThemeId } },
          create: { entryId: link.entryId, themeId: command.targetThemeId },
          update: {}
        });
      }

      for (const link of sourceSourceLinks) {
        await tx.sourceTheme.upsert({
          where: { sourceId_themeId: { sourceId: link.sourceId, themeId: command.targetThemeId } },
          create: { sourceId: link.sourceId, themeId: command.targetThemeId },
          update: {}
        });
      }

      // Reparent child themes of the source onto the target, otherwise deleting
      // the source theme would SetNull their parentThemeId and orphan the subtree.
      await tx.theme.updateMany({
        where: { parentThemeId: command.sourceThemeId },
        data: { parentThemeId: command.targetThemeId }
      });

      await tx.theme.delete({ where: { id: command.sourceThemeId } });

      return tx.theme.update({
        where: { id: command.targetThemeId },
        data: {},
        include: { _count: { select: { entries: true } } }
      });
    });

    return mapNamed(theme);
  }

  async updateProject(command: UpdateProjectCommand): Promise<NamedRecord> {
    const project = await this.prisma.project.update({
      where: { id: command.id },
      data: { name: command.name, description: command.description, status: command.status },
      include: { _count: { select: { entries: true } } }
    });
    return mapNamed(project);
  }

  async getProjectBySlug(slug: string): Promise<NamedRecordContext | null> {
    const project = await this.prisma.project.findUnique({
      where: { slug },
      include: {
        entries: {
          include: {
            entry: {
              include: entryInclude
            }
          }
        },
        _count: { select: { entries: true } }
      }
    });

    if (!project) {
      return null;
    }

    return {
      ...mapNamed(project),
      entries: project.entries.map(({ entry }) => mapEntry(entry))
    };
  }

  async getQuestion(id: string): Promise<QuestionContext | null> {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        entries: {
          include: {
            entry: {
              include: entryInclude
            }
          }
        },
        decisions: { orderBy: [{ createdAt: "desc" }] },
        tasks: { orderBy: [{ createdAt: "desc" }] }
      }
    });

    if (!question) {
      return null;
    }

    return {
      ...mapQuestion(question),
      entries: question.entries.map(({ entry }) => mapEntry(entry)),
      decisions: question.decisions.map(mapDecision),
      tasks: question.tasks.map(mapTask)
    };
  }

  async listDecisionsForQuestion(questionId: string): Promise<DecisionRecord[]> {
    const decisions = await this.prisma.decision.findMany({
      where: { questionId },
      orderBy: [{ createdAt: "desc" }]
    });

    return decisions.map(mapDecision);
  }

  async createDecision(command: CreateDecisionCommand): Promise<DecisionRecord> {
    const decision = await this.prisma.decision.create({
      data: {
        questionId: command.questionId,
        decisionText: command.decisionText,
        status: command.status,
        decidedAt: command.decidedAt ?? null,
        supersedesDecisionId: command.supersedesDecisionId ?? null
      }
    });

    return mapDecision(decision);
  }

  async updateDecisionStatus(command: UpdateDecisionStatusCommand): Promise<DecisionRecord> {
    const decision = await this.prisma.decision.update({
      where: { id: command.id },
      data: { status: command.status }
    });

    return mapDecision(decision);
  }

  async createTask(command: CreateTaskCommand): Promise<TaskRecord> {
    const task = await this.prisma.task.create({
      data: {
        decisionId: command.decisionId ?? null,
        questionId: command.questionId ?? null,
        nextAction: command.nextAction,
        status: command.status,
        dueAt: command.dueAt ?? null
      }
    });

    return mapTask(task);
  }

  async updateTaskStatus(command: UpdateTaskStatusCommand): Promise<TaskRecord> {
    const task = await this.prisma.task.update({
      where: { id: command.id },
      data: { status: command.status }
    });

    return mapTask(task);
  }

  async createSavedFilter(command: CreateSavedFilterCommand): Promise<SavedFilterRecord> {
    const baseSlug = slugifyName(command.name) || "saved-filter";
    const filter = await this.retryOnSlugConflict(baseSlug, (slug) =>
      this.prisma.savedFilter.create({
        data: {
          name: command.name,
          slug,
          description: command.description ?? null,
          params: command.params as Prisma.InputJsonValue
        }
      })
    );

    return mapSavedFilter(filter);
  }

  async listSavedFilters(): Promise<SavedFilterRecord[]> {
    const filters = await this.prisma.savedFilter.findMany({
      orderBy: [{ updatedAt: "desc" }],
      take: 50
    });

    return filters.map(mapSavedFilter);
  }

  async updateQuestion(command: UpdateQuestionCommand): Promise<QuestionRecord> {
    const question = await this.prisma.question.update({
      where: { id: command.id },
      data: {
        status: command.status,
        privacyLevel: command.privacyLevel,
        summary: command.summary ?? null
      }
    });

    return mapQuestion(question);
  }

  async listQuestions(query?: ListQuestionsQuery): Promise<QuestionRecord[]> {
    const limit = Math.min(query?.limit ?? 50, 200);
    const where: Prisma.QuestionWhereInput = {};

    if (query?.status) where.status = query.status;
    if (query?.privacyLevel) where.privacyLevel = query.privacyLevel;

    const questions = await this.prisma.question.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      take: limit
    });

    return questions.map(mapQuestion);
  }

  async createQuestion(command: CreateQuestionCommand): Promise<QuestionRecord> {
    const question = await this.prisma.question.create({
      data: {
        prompt: command.prompt,
        status: command.status,
        privacyLevel: command.privacyLevel,
        summary: command.summary ?? null
      }
    });

    return mapQuestion(question);
  }

  async deleteQuestion(id: string): Promise<void> {
    await this.prisma.question.delete({ where: { id } });
  }

  async promoteEntryToQuestion(command: PromoteEntryToQuestionCommand): Promise<QuestionRecord> {
    const question = await this.prisma.$transaction(async (tx) => {
      const entry = await tx.entry.update({
        where: { id: command.id },
        data: { type: "question" },
        select: {
          id: true,
          title: true,
          summary: true
        }
      });

      return this.ensureOriginQuestion(tx, entry);
    });

    return mapQuestion(question);
  }

  async createReference(command: CreateReferenceCommand): Promise<ReferenceRecord> {
    const reference = await this.prisma.$transaction(async (tx) => {
      const created = await tx.reference.create({
        data: {
          kind: command.kind,
          title: command.title,
          url: command.url,
          description: command.description,
          metadata: command.metadata as Prisma.InputJsonValue
        }
      });

      await tx.entryReference.create({
        data: {
          entryId: command.entryId,
          referenceId: created.id
        }
      });

      return created;
    });

    return mapReference(reference);
  }

  async createAttachment(command: CreateAttachmentCommand): Promise<AttachmentRecord> {
    const attachment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.attachment.create({
        data: {
          path: command.path,
          mediaType: command.mediaType,
          checksum: command.checksum,
          sizeBytes: command.sizeBytes !== undefined ? BigInt(command.sizeBytes) : undefined,
          title: command.title,
          description: command.description,
          metadata: command.metadata as Prisma.InputJsonValue
        }
      });

      await tx.entryAttachment.create({
        data: {
          entryId: command.entryId,
          attachmentId: created.id
        }
      });

      return created;
    });

    return mapAttachment(attachment);
  }

  async createThread(command: CreateThreadCommand): Promise<ThreadRecord> {
    const baseSlug = slugifyName(command.title) || "thread";
    const thread = await this.retryOnSlugConflict(baseSlug, (slug) =>
      this.prisma.$transaction(async (tx) => {
        const created = await tx.thread.create({
          data: {
            slug,
            title: command.title,
            description: command.description,
            status: command.status,
            metadata: command.metadata as Prisma.InputJsonValue
          }
        });

        const uniqueEntryIds = [...new Set(command.entryIds)];
        if (uniqueEntryIds.length > 0) {
          await tx.entryThread.createMany({
            data: uniqueEntryIds.map((entryId, index) => ({
              entryId,
              threadId: created.id,
              position: index + 1
            }))
          });
        }

        return tx.thread.findUniqueOrThrow({
          where: { id: created.id },
          include: {
            entries: {
              include: {
                entry: {
                  include: entryInclude
                }
              },
              orderBy: { position: "asc" }
            }
          }
        });
      })
    );

    return mapThread(
      thread,
      thread.entries.map(({ entry }) => mapEntry(entry))
    );
  }

  async listThreads(): Promise<Omit<ThreadRecord, "entries">[]> {
    const threads = await this.prisma.thread.findMany({
      orderBy: [{ updatedAt: "desc" }],
      take: 100
    });

    return threads.map((thread) => ({
      id: thread.id,
      slug: thread.slug,
      title: thread.title,
      description: optional(thread.description),
      status: thread.status,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt
    }));
  }

  async getThreadBySlug(slug: string): Promise<ThreadRecord | null> {
    const thread = await this.prisma.thread.findUnique({
      where: { slug },
      include: {
        entries: {
          include: {
            entry: {
              include: entryInclude
            }
          },
          orderBy: { position: "asc" }
        }
      }
    });

    if (!thread) {
      return null;
    }

    return mapThread(
      thread,
      thread.entries.map(({ entry }) => mapEntry(entry))
    );
  }

  async deleteThread(id: string): Promise<void> {
    await this.prisma.thread.delete({ where: { id } });
  }

  async addEntryToThread(command: AddEntryToThreadCommand): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.entryThread.findUnique({
        where: { entryId_threadId: { entryId: command.entryId, threadId: command.threadId } }
      });
      if (existing) return;

      const last = await tx.entryThread.findFirst({
        where: { threadId: command.threadId },
        orderBy: { position: "desc" }
      });

      await tx.entryThread.create({
        data: {
          entryId: command.entryId,
          threadId: command.threadId,
          position: (last?.position ?? 0) + 1
        }
      });
    });
  }

  async moveEntryInThread(command: MoveEntryInThreadCommand): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.entryThread.findUnique({
        where: { entryId_threadId: { entryId: command.entryId, threadId: command.threadId } }
      });
      if (!current) return;

      const neighbor = await tx.entryThread.findFirst({
        where: {
          threadId: command.threadId,
          position: command.direction === "up" ? { lt: current.position } : { gt: current.position }
        },
        orderBy: { position: command.direction === "up" ? "desc" : "asc" }
      });
      if (!neighbor) return;

      await tx.entryThread.update({
        where: { entryId_threadId: { entryId: current.entryId, threadId: current.threadId } },
        data: { position: -1 }
      });
      await tx.entryThread.update({
        where: { entryId_threadId: { entryId: neighbor.entryId, threadId: neighbor.threadId } },
        data: { position: current.position }
      });
      await tx.entryThread.update({
        where: { entryId_threadId: { entryId: current.entryId, threadId: current.threadId } },
        data: { position: neighbor.position }
      });
    });
  }

  async getGraphSnapshot(): Promise<GraphSnapshot> {
    const [entries, themes, projects, questions, threads, sources] = await Promise.all([
      this.listEntries({ limit: 120 }),
      this.prisma.theme.findMany({
        include: { _count: { select: { entries: true } } },
        orderBy: { name: "asc" }
      }),
      this.prisma.project.findMany({
        include: { _count: { select: { entries: true } } },
        orderBy: { name: "asc" }
      }),
      this.prisma.question.findMany({
        orderBy: { updatedAt: "desc" },
        take: 120
      }),
      this.listThreads(),
      this.listSources({ limit: 200, offset: 0 })
    ]);

    return {
      entries,
      themes: themes.map(mapNamed),
      projects: projects.map(mapNamed),
      questions: questions.map(mapQuestion),
      threads,
      sources
    };
  }

  async getDashboardOverview(): Promise<DashboardOverview> {
    const [recentEntries, openQuestions, activeThemes, activeProjects, counts] = await Promise.all([
      this.listEntries({ limit: 8 }),
      this.prisma.question.findMany({
        where: { status: { in: ["open", "active", "parked"] } },
        orderBy: [{ updatedAt: "desc" }],
        take: 8
      }),
      this.prisma.theme.findMany({
        where: { status: "active" },
        include: { _count: { select: { entries: true } } },
        orderBy: [{ updatedAt: "desc" }],
        take: 8
      }),
      this.prisma.project.findMany({
        where: { status: "active" },
        include: { _count: { select: { entries: true } } },
        orderBy: [{ updatedAt: "desc" }],
        take: 8
      }),
      Promise.all([
        this.prisma.entry.count(),
        this.prisma.question.count({ where: { status: { in: ["open", "active", "parked"] } } }),
        this.prisma.theme.count(),
        this.prisma.project.count()
      ])
    ]);

    return {
      recentEntries,
      openQuestions: openQuestions.map(mapQuestion),
      activeThemes: activeThemes.map(mapNamed),
      activeProjects: activeProjects.map(mapNamed),
      counts: {
        entries: counts[0],
        openQuestions: counts[1],
        themes: counts[2],
        projects: counts[3]
      }
    };
  }

  async getDashboardHome(): Promise<DashboardHome> {
    const [recentEntries, openQuestions, activeProjects, counts] = await Promise.all([
      this.listEntries({ privacyLevel: "shareable", limit: 8 }),
      this.prisma.question.findMany({
        where: {
          status: { in: ["open", "active", "parked"] },
          privacyLevel: "shareable"
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 8
      }),
      this.prisma.project.findMany({
        where: { status: "active" },
        include: { _count: { select: { entries: true } } },
        orderBy: [{ updatedAt: "desc" }],
        take: 8
      }),
      Promise.all([
        this.prisma.entry.count({ where: { privacyLevel: "shareable" } }),
        this.prisma.question.count({ where: { status: { in: ["open", "active", "parked"] }, privacyLevel: "shareable" } }),
        this.prisma.project.count({ where: { status: "active" } })
      ])
    ]);

    return {
      recentEntries: recentEntries.map(({ id, title, type, capturedAt, privacyLevel }) => ({ id, title, type, capturedAt, privacyLevel })),
      openQuestions: openQuestions.map(({ id, prompt, status, privacyLevel, summary }) => ({ id, prompt, status, privacyLevel, summary: summary ?? undefined })),
      activeProjects: activeProjects.map(mapNamed),
      counts: { entries: counts[0], openQuestions: counts[1], activeProjects: counts[2] }
    };
  }

  async getCabinetOverview(): Promise<CabinetOverview> {
    const [entryTypeCounts, entryStatusCounts, archivedEntries, themes, projects, questions, threads, sourceTypeCounts] =
      await Promise.all([
        this.prisma.entry.groupBy({ by: ["type"], _count: { _all: true } }),
        this.prisma.entry.groupBy({ by: ["status"], _count: { _all: true } }),
        this.listEntries({ status: "archived", limit: 8 }),
        this.prisma.theme.findMany({
          include: { _count: { select: { entries: true } } },
          orderBy: [{ name: "asc" }],
          take: 16
        }),
        this.prisma.project.findMany({
          include: { _count: { select: { entries: true } } },
          orderBy: [{ updatedAt: "desc" }],
          take: 16
        }),
        this.prisma.question.findMany({ orderBy: [{ updatedAt: "desc" }], take: 12 }),
        this.listThreads(),
        this.prisma.source.groupBy({ by: ["type"], _count: { _all: true } })
      ]);

    const countByType = new Map(entryTypeCounts.map((row) => [row.type, row._count._all]));
    const countByStatus = new Map(entryStatusCounts.map((row) => [row.status, row._count._all]));
    const countBySourceType = new Map<string, number>(sourceTypeCounts.map((row) => [row.type, row._count._all]));
    const sourceCount = sourceTypeCounts.reduce((sum, row) => sum + row._count._all, 0);

    return {
      entryTypes: entryTypes.map((type) => ({ type, count: countByType.get(type) ?? 0 })),
      entryStatuses: entryStatuses.map((status) => ({ status, count: countByStatus.get(status) ?? 0 })),
      archivedEntries,
      themes: themes.map(mapNamed),
      projects: projects.map(mapNamed),
      questions: questions.map(mapQuestion),
      threads: threads.slice(0, 16),
      sourceTypes: sourceTypes.map((type) => ({ type, count: countBySourceType.get(type) ?? 0 })),
      sourceCount
    };
  }

  async createSource(command: CreateSourceCommand): Promise<SourceRecord> {
    const searchText = metadataToSearchText(command.metadata);
    const source = await this.prisma.$transaction(async (tx) => {
      const created = await tx.source.create({
        data: {
          type: command.type,
          title: command.title,
          description: command.description ?? null,
          body: command.body ?? null,
          status: command.status,
          privacyLevel: command.privacyLevel,
          metadata: command.metadata as Prisma.InputJsonValue,
          searchText: searchText || null
        }
      });

      const themeIds = [...new Set(command.themeIds)];
      if (themeIds.length > 0) {
        await tx.sourceTheme.createMany({ data: themeIds.map((themeId) => ({ sourceId: created.id, themeId })) });
      }

      const allReferenceIds = [...new Set(command.referenceIds)];
      for (const { title, url } of command.newReferenceUrls) {
        const ref = await tx.reference.create({ data: { kind: "url", title, url } });
        allReferenceIds.push(ref.id);
      }
      if (allReferenceIds.length > 0) {
        await tx.sourceReference.createMany({ data: allReferenceIds.map((referenceId) => ({ sourceId: created.id, referenceId })) });
      }

      return tx.source.findUniqueOrThrow({ where: { id: created.id }, include: sourceInclude });
    });

    const mapped = mapSource(source);
    if (!mapped) throw new Error(`Failed to map created source ${source.id}: invalid metadata.`);
    return mapped;
  }

  async updateSource(command: UpdateSourceCommand): Promise<SourceRecord> {
    const existing = await this.prisma.source.findUnique({ where: { id: command.id }, select: { type: true } });
    if (!existing) throw new Error(`Source "${command.id}" not found.`);
    if (command.metadata.type !== existing.type) {
      throw new Error(`Cannot change source type from "${existing.type}" to "${command.metadata.type}".`);
    }

    const searchText = metadataToSearchText(command.metadata);
    const source = await this.prisma.$transaction(async (tx) => {
      await tx.source.update({
        where: { id: command.id },
        data: {
          title: command.title,
          description: command.description ?? null,
          body: command.body ?? null,
          status: command.status,
          privacyLevel: command.privacyLevel,
          metadata: command.metadata as Prisma.InputJsonValue,
          searchText: searchText || null
        }
      });

      await tx.sourceTheme.deleteMany({ where: { sourceId: command.id } });
      const themeIds = [...new Set(command.themeIds)];
      if (themeIds.length > 0) {
        await tx.sourceTheme.createMany({ data: themeIds.map((themeId) => ({ sourceId: command.id, themeId })) });
      }

      await tx.sourceReference.deleteMany({ where: { sourceId: command.id } });
      const allReferenceIds = [...new Set(command.referenceIds)];
      for (const { title, url } of command.newReferenceUrls) {
        const ref = await tx.reference.create({ data: { kind: "url", title, url } });
        allReferenceIds.push(ref.id);
      }
      if (allReferenceIds.length > 0) {
        await tx.sourceReference.createMany({ data: allReferenceIds.map((referenceId) => ({ sourceId: command.id, referenceId })) });
      }

      return tx.source.findUniqueOrThrow({ where: { id: command.id }, include: sourceInclude });
    });

    const mapped = mapSource(source);
    if (!mapped) throw new Error(`Failed to map updated source ${source.id}: invalid metadata.`);
    return mapped;
  }

  async deleteSource(id: string): Promise<void> {
    await this.prisma.source.delete({ where: { id } });
  }

  private async findSourceSearchIds(search: string): Promise<string[]> {
    // 'dutch' config stems the mostly-Dutch imported content (was 'simple', no
    // stemming); the GIN index on Source is built with the matching config.
    // Fetch the full ranked candidate set (fixed cap, not `limit`) so the
    // type/status/theme filters can be applied across all matches before limiting.
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT "id"
      FROM "Source"
      WHERE to_tsvector('dutch', coalesce("title", '') || ' ' || coalesce("description", '') || ' ' || coalesce("body", '') || ' ' || coalesce("searchText", ''))
        @@ plainto_tsquery('dutch', ${search})
      ORDER BY ts_rank(
        to_tsvector('dutch', coalesce("title", '') || ' ' || coalesce("description", '') || ' ' || coalesce("body", '') || ' ' || coalesce("searchText", '')),
        plainto_tsquery('dutch', ${search})
      ) DESC
      LIMIT ${SOURCE_SEARCH_CANDIDATE_LIMIT}
    `;
    return rows.map((r) => r.id);
  }

  private buildSourceWhere(query?: ListSourcesQuery): Prisma.SourceWhereInput {
    const where: Prisma.SourceWhereInput = {};
    if (query?.type) where.type = query.type;
    if (query?.status) where.status = query.status;
    if (query?.privacyLevel) where.privacyLevel = query.privacyLevel;
    if (query?.themeSlug) where.themes = { some: { theme: { slug: query.themeSlug } } };
    return where;
  }

  async listSources(query?: ListSourcesQuery): Promise<SourceSummary[]> {
    return (await this.listSourcesWithTotal(query)).items;
  }

  async countSources(query?: ListSourcesQuery): Promise<number> {
    return (await this.listSourcesWithTotal(query)).total;
  }

  async listSourcesWithTotal(query?: ListSourcesQuery): Promise<SourceListResult> {
    const limit = Math.min(query?.limit ?? 50, 200);
    const offset = Math.max(query?.offset ?? 0, 0);
    const where = this.buildSourceWhere(query);

    if (!query?.search) {
      const orderBy: Prisma.SourceOrderByWithRelationInput[] =
        query?.sort === "createdAt"
          ? [{ createdAt: "desc" }]
          : query?.sort === "updatedAt"
            ? [{ updatedAt: "desc" }]
            : [{ title: "asc" }];
      const [sources, total] = await Promise.all([
        this.prisma.source.findMany({ where, include: sourceInclude, orderBy, skip: offset, take: limit }),
        this.prisma.source.count({ where })
      ]);
      return {
        items: sources.map(mapSourceSummary).filter((s): s is SourceSummary => s !== null),
        total,
        searchCapped: false
      };
    }

    // One ranked-candidate query, then a cheap id-only lookup to apply
    // type/status/theme filters, then a single hydrated fetch for just the
    // requested page — avoids running the FTS query twice (list + count) and
    // avoids pulling full records (with relations) for every candidate.
    const searchIds = await this.findSourceSearchIds(query.search);
    const rank = new Map(searchIds.map((id, i) => [id, i]));

    const filteredRows = await this.prisma.source.findMany({
      where: { ...where, id: { in: searchIds } },
      select: { id: true }
    });
    const orderedIds = filteredRows
      .map((row) => row.id)
      .sort((a, b) => (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity));

    const pageIds = orderedIds.slice(offset, offset + limit);
    const pageSources = pageIds.length
      ? await this.prisma.source.findMany({ where: { id: { in: pageIds } }, include: sourceInclude })
      : [];
    const byId = new Map(pageSources.map((source) => [source.id, source]));

    const items = pageIds
      .map((id) => byId.get(id))
      .filter((source): source is SourceWithRelations => source !== undefined)
      .map(mapSourceSummary)
      .filter((s): s is SourceSummary => s !== null);

    return {
      items,
      total: orderedIds.length,
      searchCapped: searchIds.length >= SOURCE_SEARCH_CANDIDATE_LIMIT
    };
  }

  async getSource(id: string): Promise<SourceRecord | null> {
    const source = await this.prisma.source.findUnique({
      where: { id },
      include: {
        ...sourceInclude,
        messages: { orderBy: { position: "asc" } },
        excerpts: {
          orderBy: { createdAt: "asc" },
          include: {
            entries: { include: { entry: { select: { id: true, title: true } } } }
          }
        }
      }
    });
    return source ? mapSource(source) : null;
  }

  async listSourcesByType(type: SourceType, limit = 500): Promise<SourceSummary[]> {
    const sources = await this.prisma.source.findMany({
      where: { type, status: "active" },
      include: sourceInclude,
      orderBy: [{ title: "asc" }],
      take: limit
    });
    return sources.map(mapSourceSummary).filter((s): s is SourceSummary => s !== null);
  }

  async linkSourceToReference(sourceId: string, referenceId: string): Promise<void> {
    await this.prisma.sourceReference.upsert({
      where: { sourceId_referenceId: { sourceId, referenceId } },
      update: {},
      create: { sourceId, referenceId }
    });
  }

  async unlinkSourceFromReference(sourceId: string, referenceId: string): Promise<void> {
    await this.prisma.sourceReference.deleteMany({ where: { sourceId, referenceId } });
  }

  async linkEntryToSource(entryId: string, sourceId: string): Promise<void> {
    await this.prisma.entrySource.upsert({
      where: { entryId_sourceId: { entryId, sourceId } },
      update: {},
      create: { entryId, sourceId }
    });
  }

  async unlinkEntryFromSource(entryId: string, sourceId: string): Promise<void> {
    await this.prisma.entrySource.deleteMany({ where: { entryId, sourceId } });
  }

  async createExcerpt(command: CreateExcerptCommand): Promise<ExcerptRecord> {
    let sourceText: string | null = null;

    if (command.messageId) {
      const message = await this.prisma.sourceMessage.findUnique({
        where: { id: command.messageId },
        select: { sourceId: true, text: true }
      });
      if (!message || message.sourceId !== command.sourceId) {
        throw new Error(`Message "${command.messageId}" does not belong to source "${command.sourceId}".`);
      }
      sourceText = message.text;
    } else {
      const source = await this.prisma.source.findUnique({ where: { id: command.sourceId }, select: { body: true } });
      sourceText = source?.body ?? null;
    }

    if (sourceText === null || !excerptTextIsQuoted(command.text, sourceText)) {
      throw new Error("Excerpt text must be a literal quote from the source/message text.");
    }

    const created = await this.prisma.sourceExcerpt.create({
      data: {
        sourceId: command.sourceId,
        messageId: command.messageId ?? null,
        text: command.text,
        note: command.note ?? null
      }
    });

    return {
      id: created.id,
      sourceId: created.sourceId,
      messageId: optional(created.messageId),
      text: created.text,
      note: optional(created.note),
      createdAt: created.createdAt,
      entries: []
    };
  }

  async linkEntryToExcerpt(entryId: string, excerptId: string): Promise<void> {
    await this.prisma.entryExcerpt.upsert({
      where: { entryId_excerptId: { entryId, excerptId } },
      update: {},
      create: { entryId, excerptId }
    });
  }

  async unlinkEntryFromExcerpt(entryId: string, excerptId: string): Promise<void> {
    await this.prisma.entryExcerpt.deleteMany({ where: { entryId, excerptId } });
  }

  async linkSourceToTheme(sourceId: string, themeId: string): Promise<void> {
    await this.prisma.sourceTheme.upsert({
      where: { sourceId_themeId: { sourceId, themeId } },
      update: {},
      create: { sourceId, themeId }
    });
  }

  async unlinkSourceFromTheme(sourceId: string, themeId: string): Promise<void> {
    await this.prisma.sourceTheme.deleteMany({ where: { sourceId, themeId } });
  }

  private async wouldCreateThemeCycle(themeId: string, proposedParentId: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ found: boolean }[]>`
      WITH RECURSIVE ancestors AS (
        SELECT id, "parentThemeId"
        FROM "Theme"
        WHERE id = ${proposedParentId}
        UNION ALL
        SELECT t.id, t."parentThemeId"
        FROM "Theme" t
        INNER JOIN ancestors a ON t.id = a."parentThemeId"
      )
      SELECT EXISTS(SELECT 1 FROM ancestors WHERE id = ${themeId}) AS found
    `;
    return rows[0]?.found ?? false;
  }

  async setThemeParent(themeId: string, parentThemeId: string | null): Promise<void> {
    if (parentThemeId !== null) {
      const hasCycle = await this.wouldCreateThemeCycle(themeId, parentThemeId);
      if (hasCycle) {
        throw new Error(`Setting parentThemeId="${parentThemeId}" on theme "${themeId}" would create a cycle.`);
      }
    }

    await this.prisma.theme.update({
      where: { id: themeId },
      data: { parentThemeId }
    });
  }

  async listThemes(): Promise<NamedRecord[]> {
    const themes = await this.prisma.theme.findMany({
      include: { _count: { select: { entries: true } } },
      orderBy: { name: "asc" }
    });
    return themes.map(mapNamed);
  }

  async getContextMirrorSnapshot(): Promise<ContextMirrorSnapshot> {
    const [entries, openQuestions, themes, projects, threads, rawSources] = await Promise.all([
      this.prisma.entry.findMany({
        include: entryInclude,
        orderBy: [{ capturedAt: "desc" }, { createdAt: "desc" }],
        take: 200
      }),
      this.prisma.question.findMany({
        where: { status: { in: ["open", "active", "parked"] } },
        orderBy: [{ updatedAt: "desc" }],
        take: 100
      }),
      this.prisma.theme.findMany({
        include: { _count: { select: { entries: true } } },
        orderBy: [{ name: "asc" }]
      }),
      this.prisma.project.findMany({
        include: { _count: { select: { entries: true } } },
        orderBy: [{ name: "asc" }]
      }),
      this.prisma.thread.findMany({
        include: {
          entries: {
            include: {
              entry: {
                include: entryInclude
              }
            },
            orderBy: { position: "asc" }
          }
        },
        orderBy: [{ updatedAt: "desc" }]
      }),
      this.prisma.source.findMany({
        include: sourceInclude,
        orderBy: [{ title: "asc" }],
        take: 500
      })
    ]);

    return {
      entries: entries.map((entry) => mapEntry(entry)),
      openQuestions: openQuestions.map(mapQuestion),
      themes: themes.map(mapNamed),
      projects: projects.map(mapNamed),
      threads: threads.map((thread) =>
        mapThread(
          thread,
          thread.entries.map(({ entry }) => mapEntry(entry))
        )
      ),
      sources: rawSources.map(mapSource).filter((s): s is SourceRecord => s !== null)
    };
  }
}

function wrapDbErrors<T extends object>(repo: T): T {
  return new Proxy(repo, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;
      return async function (...args: unknown[]) {
        try {
          return await (value as (...a: unknown[]) => unknown).apply(target, args);
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientInitializationError ||
            (error instanceof Prisma.PrismaClientKnownRequestError && error.code.startsWith("P1"))
          ) {
            throw new DatabaseUnavailableError();
          }
          throw error;
        }
      };
    }
  });
}

export function createPrismaContextRepository(): ContextRepository {
  return wrapDbErrors(new PrismaContextRepository());
}
