import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import {
  entryStatuses,
  entryTypes,
  savedFilterParamsSchema,
  slugifyName,
  type CreateAttachmentCommand,
  type CreateEntryCommand,
  type CreateReferenceCommand,
  type CreateSavedFilterCommand,
  type CreateThreadCommand,
  type ListEntriesQuery,
  type LinkObjectsCommand,
  type PromoteEntryToQuestionCommand,
  type UpdateEntryCommand,
  type UpdateQuestionCommand
} from "@/domain/context";
import type {
  AttachmentRecord,
  CabinetOverview,
  ContextMirrorSnapshot,
  ContextRepository,
  DashboardOverview,
  EntryRecord,
  GraphSnapshot,
  NamedRecord,
  NamedRecordContext,
  QuestionContext,
  QuestionRecord,
  ReferenceRecord,
  RelationshipRecord,
  RelationshipTarget,
  SavedFilterRecord,
  ThreadRecord
} from "@/repositories/context-repository";

import { getPrismaClient } from "./client";

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
  }
} satisfies Prisma.EntryInclude;

type EntryWithRelations = Prisma.EntryGetPayload<{
  include: typeof entryInclude;
}>;

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
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
  createdAt: Date;
  updatedAt: Date;
}): ReferenceRecord {
  return {
    id: reference.id,
    kind: reference.kind,
    title: reference.title,
    url: optional(reference.url),
    description: optional(reference.description),
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
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt
  };
}

function mapRelationship(relationship: {
  id: string;
  fromType: RelationshipRecord["fromType"];
  fromId: string;
  toType: RelationshipRecord["toType"];
  toId: string;
  relationType: RelationshipRecord["relationType"];
  note: string | null;
  createdAt: Date;
}): RelationshipRecord {
  return {
    id: relationship.id,
    fromType: relationship.fromType,
    fromId: relationship.fromId,
    toType: relationship.toType,
    toId: relationship.toId,
    relationType: relationship.relationType,
    note: optional(relationship.note),
    createdAt: relationship.createdAt
  };
}

function mapEntry(
  entry: EntryWithRelations,
  relationships: { outgoing?: RelationshipRecord[]; incoming?: RelationshipRecord[] } = {}
): EntryRecord {
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
    outgoingRelationships: relationships.outgoing ?? [],
    incomingRelationships: relationships.incoming ?? []
  };
}

function mapQuestion(question: {
  id: string;
  prompt: string;
  status: QuestionRecord["status"];
  summary: string | null;
  originEntryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): QuestionRecord {
  return {
    id: question.id,
    prompt: question.prompt,
    status: question.status,
    summary: optional(question.summary),
    originEntryId: optional(question.originEntryId),
    createdAt: question.createdAt,
    updatedAt: question.updatedAt
  };
}

function mapNamed(record: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  _count?: { entries?: number };
}): NamedRecord {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: optional(record.description),
    count: record._count?.entries
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

  return {
    id: filter.id,
    slug: filter.slug,
    name: filter.name,
    description: optional(filter.description),
    params: parsedParams.success ? parsedParams.data : {},
    createdAt: filter.createdAt,
    updatedAt: filter.updatedAt
  };
}

function entryWhere(query?: Partial<ListEntriesQuery>, searchIds?: string[]): Prisma.EntryWhereInput {
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

  private async getRelationshipsForObject(type: RelationshipRecord["fromType"], id: string) {
    const [outgoing, incoming] = await Promise.all([
      this.prisma.relationship.findMany({
        where: { fromType: type, fromId: id },
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.relationship.findMany({
        where: { toType: type, toId: id },
        orderBy: { createdAt: "desc" }
      })
    ]);

    return {
      outgoing: outgoing.map(mapRelationship),
      incoming: incoming.map(mapRelationship)
    };
  }

  private async syncEntryNames(tx: Prisma.TransactionClient, entryId: string, themeNames: string[], projectNames: string[]) {
    await tx.entryTheme.deleteMany({ where: { entryId } });
    await tx.entryProject.deleteMany({ where: { entryId } });

    for (const name of themeNames) {
      const slug = slugifyName(name);
      if (!slug) {
        continue;
      }

      const theme = await tx.theme.upsert({
        where: { slug },
        update: { name },
        create: { slug, name }
      });

      await tx.entryTheme.create({
        data: {
          entryId,
          themeId: theme.id
        }
      });
    }

    for (const name of projectNames) {
      const slug = slugifyName(name);
      if (!slug) {
        continue;
      }

      const project = await tx.project.upsert({
        where: { slug },
        update: { name },
        create: { slug, name }
      });

      await tx.entryProject.create({
        data: {
          entryId,
          projectId: project.id
        }
      });
    }
  }

  private async uniqueThreadSlug(title: string): Promise<string> {
    const baseSlug = slugifyName(title) || "thread";
    let candidate = baseSlug;
    let suffix = 2;

    while (await this.prisma.thread.findUnique({ where: { slug: candidate }, select: { id: true } })) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private async uniqueSavedFilterSlug(name: string): Promise<string> {
    const baseSlug = slugifyName(name) || "saved-filter";
    let candidate = baseSlug;
    let suffix = 2;

    while (await this.prisma.savedFilter.findUnique({ where: { slug: candidate }, select: { id: true } })) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
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
          type: command.type,
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

      if (command.type === "question") {
        await this.ensureOriginQuestion(tx, {
          id: command.id,
          title: command.title,
          summary: command.summary ?? null
        });
      }

      return tx.entry.findUniqueOrThrow({
        where: { id: command.id },
        include: entryInclude
      });
    });

    const relationships = await this.getRelationshipsForObject("entry", entry.id);
    return mapEntry(entry, relationships);
  }

  async listEntries(query: Partial<ListEntriesQuery> = {}): Promise<EntryRecord[]> {
    const searchIds = query.search ? await this.searchEntryIds(query.search, 200) : undefined;
    const entries = await this.prisma.entry.findMany({
      where: entryWhere(query, searchIds),
      include: entryInclude,
      orderBy: [{ capturedAt: "desc" }, { createdAt: "desc" }],
      take: query.limit ?? 50
    });

    return entries.map((entry) => mapEntry(entry));
  }

  async getEntry(id: string): Promise<EntryRecord | null> {
    const [entry, relationships] = await Promise.all([
      this.prisma.entry.findUnique({
        where: { id },
        include: entryInclude
      }),
      this.getRelationshipsForObject("entry", id)
    ]);

    return entry ? mapEntry(entry, relationships) : null;
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
    const [question, relationships] = await Promise.all([
      this.prisma.question.findUnique({
        where: { id },
        include: {
          entries: {
            include: {
              entry: {
                include: entryInclude
              }
            }
          }
        }
      }),
      this.getRelationshipsForObject("question", id)
    ]);

    if (!question) {
      return null;
    }

    return {
      ...mapQuestion(question),
      entries: question.entries.map(({ entry }) => mapEntry(entry)),
      outgoingRelationships: relationships.outgoing,
      incomingRelationships: relationships.incoming
    };
  }

  async listRelationshipTargets(): Promise<RelationshipTarget[]> {
    const [entries, themes, projects, questions, threads, references, attachments] = await Promise.all([
      this.prisma.entry.findMany({
        orderBy: [{ capturedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          privacyLevel: true
        },
        take: 80
      }),
      this.prisma.theme.findMany({
        where: { status: "active" },
        include: { _count: { select: { entries: true } } },
        orderBy: [{ updatedAt: "desc" }],
        take: 80
      }),
      this.prisma.project.findMany({
        where: { status: "active" },
        include: { _count: { select: { entries: true } } },
        orderBy: [{ updatedAt: "desc" }],
        take: 80
      }),
      this.prisma.question.findMany({
        orderBy: [{ updatedAt: "desc" }],
        select: {
          id: true,
          prompt: true,
          status: true
        },
        take: 80
      }),
      this.prisma.thread.findMany({
        orderBy: [{ updatedAt: "desc" }],
        select: {
          id: true,
          title: true,
          status: true
        },
        take: 80
      }),
      this.prisma.reference.findMany({
        orderBy: [{ updatedAt: "desc" }],
        select: {
          id: true,
          kind: true,
          title: true,
          url: true
        },
        take: 80
      }),
      this.prisma.attachment.findMany({
        orderBy: [{ updatedAt: "desc" }],
        select: {
          id: true,
          path: true,
          mediaType: true,
          title: true
        },
        take: 80
      })
    ]);

    return [
      ...entries.map((entry) => ({
        objectType: "entry" as const,
        objectId: entry.id,
        label: entry.title,
        detail: `${entry.type} / ${entry.status} / ${entry.privacyLevel}`
      })),
      ...themes.map((theme) => ({
        objectType: "theme" as const,
        objectId: theme.id,
        label: theme.name,
        detail: `${theme._count.entries} entries`
      })),
      ...projects.map((project) => ({
        objectType: "project" as const,
        objectId: project.id,
        label: project.name,
        detail: `${project._count.entries} entries`
      })),
      ...questions.map((question) => ({
        objectType: "question" as const,
        objectId: question.id,
        label: question.prompt,
        detail: question.status
      })),
      ...threads.map((thread) => ({
        objectType: "thread" as const,
        objectId: thread.id,
        label: thread.title,
        detail: thread.status
      })),
      ...references.map((reference) => ({
        objectType: "reference" as const,
        objectId: reference.id,
        label: reference.title,
        detail: [reference.kind, reference.url].filter(Boolean).join(" / ")
      })),
      ...attachments.map((attachment) => ({
        objectType: "attachment" as const,
        objectId: attachment.id,
        label: attachment.title ?? attachment.path,
        detail: [attachment.mediaType, attachment.path].filter(Boolean).join(" / ")
      }))
    ];
  }

  async createSavedFilter(command: CreateSavedFilterCommand): Promise<SavedFilterRecord> {
    const slug = await this.uniqueSavedFilterSlug(command.name);
    const filter = await this.prisma.savedFilter.create({
      data: {
        name: command.name,
        slug,
        description: command.description ?? null,
        params: command.params as Prisma.InputJsonValue
      }
    });

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
        summary: command.summary ?? null
      }
    });

    return mapQuestion(question);
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

  async linkObjects(command: LinkObjectsCommand): Promise<RelationshipRecord> {
    const relationship = await this.prisma.relationship.create({
      data: {
        fromType: command.fromType,
        fromId: command.fromId,
        toType: command.toType,
        toId: command.toId,
        relationType: command.relationType,
        note: command.note
      }
    });

    return mapRelationship(relationship);
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
    const slug = await this.uniqueThreadSlug(command.title);
    const thread = await this.prisma.$transaction(async (tx) => {
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
      for (const [index, entryId] of uniqueEntryIds.entries()) {
        await tx.entryThread.create({
          data: {
            entryId,
            threadId: created.id,
            position: index + 1
          }
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
    });

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

  async getGraphSnapshot(): Promise<GraphSnapshot> {
    const [entries, themes, projects, questions, threads, relationships] = await Promise.all([
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
      this.prisma.relationship.findMany({
        orderBy: { createdAt: "desc" },
        take: 240
      })
    ]);

    return {
      entries,
      themes: themes.map(mapNamed),
      projects: projects.map(mapNamed),
      questions: questions.map(mapQuestion),
      threads,
      relationships: relationships.map(mapRelationship)
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

  async getCabinetOverview(): Promise<CabinetOverview> {
    const [entryTypeCounts, entryStatusCounts, archivedEntries, themes, projects, questions, threads] =
      await Promise.all([
        this.prisma.entry.groupBy({
          by: ["type"],
          _count: { _all: true }
        }),
        this.prisma.entry.groupBy({
          by: ["status"],
          _count: { _all: true }
        }),
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
        this.prisma.question.findMany({
          orderBy: [{ updatedAt: "desc" }],
          take: 12
        }),
        this.listThreads()
      ]);

    const countByType = new Map(entryTypeCounts.map((row) => [row.type, row._count._all]));
    const countByStatus = new Map(entryStatusCounts.map((row) => [row.status, row._count._all]));

    return {
      entryTypes: entryTypes.map((type) => ({
        type,
        count: countByType.get(type) ?? 0
      })),
      entryStatuses: entryStatuses.map((status) => ({
        status,
        count: countByStatus.get(status) ?? 0
      })),
      archivedEntries,
      themes: themes.map(mapNamed),
      projects: projects.map(mapNamed),
      questions: questions.map(mapQuestion),
      threads: threads.slice(0, 16)
    };
  }

  async getContextMirrorSnapshot(): Promise<ContextMirrorSnapshot> {
    const [entries, openQuestions, themes, projects, threads] = await Promise.all([
      this.listEntries({ limit: 200 }),
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
      this.listThreads()
    ]);

    return {
      entries,
      openQuestions: openQuestions.map(mapQuestion),
      themes: themes.map(mapNamed),
      projects: projects.map(mapNamed),
      threads
    };
  }
}

export function createPrismaContextRepository(): ContextRepository {
  return new PrismaContextRepository();
}
