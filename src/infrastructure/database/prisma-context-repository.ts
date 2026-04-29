import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import { slugifyName, type CreateEntryCommand, type ListEntriesQuery } from "@/domain/context";
import type {
  ContextMirrorSnapshot,
  ContextRepository,
  DashboardOverview,
  EntryRecord,
  NamedRecord,
  NamedRecordContext,
  QuestionContext,
  QuestionRecord
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
      .sort((a, b) => a.prompt.localeCompare(b.prompt))
  };
}

function mapQuestion(question: {
  id: string;
  prompt: string;
  status: QuestionRecord["status"];
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
}): QuestionRecord {
  return {
    id: question.id,
    prompt: question.prompt,
    status: question.status,
    summary: optional(question.summary),
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

function entryWhere(query?: Partial<ListEntriesQuery>): Prisma.EntryWhereInput {
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

  if (query?.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { body: { contains: query.search, mode: "insensitive" } },
      { summary: { contains: query.search, mode: "insensitive" } }
    ];
  }

  return where;
}

export class PrismaContextRepository implements ContextRepository {
  constructor(private readonly prisma: PrismaClient = getPrismaClient()) {}

  async createEntry(command: CreateEntryCommand): Promise<EntryRecord> {
    const entry = await this.prisma.$transaction(async (tx) => {
      const created = await tx.entry.create({
        data: {
          type: command.type,
          status: command.status,
          title: command.title,
          body: command.body,
          summary: command.summary,
          source: command.source,
          confidence: command.confidence,
          privacyLevel: command.privacyLevel,
          occurredAt: command.occurredAt,
          metadata: command.metadata as Prisma.InputJsonValue
        }
      });

      for (const name of command.themeNames) {
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
            entryId: created.id,
            themeId: theme.id
          }
        });
      }

      for (const name of command.projectNames) {
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
            entryId: created.id,
            projectId: project.id
          }
        });
      }

      if (command.type === "question") {
        const question = await tx.question.create({
          data: {
            prompt: command.title,
            summary: command.summary,
            originEntryId: created.id,
            status: "open"
          }
        });

        await tx.entryQuestion.create({
          data: {
            entryId: created.id,
            questionId: question.id
          }
        });
      }

      return tx.entry.findUniqueOrThrow({
        where: { id: created.id },
        include: entryInclude
      });
    });

    return mapEntry(entry);
  }

  async listEntries(query: Partial<ListEntriesQuery> = {}): Promise<EntryRecord[]> {
    const entries = await this.prisma.entry.findMany({
      where: entryWhere(query),
      include: entryInclude,
      orderBy: [{ capturedAt: "desc" }, { createdAt: "desc" }],
      take: query.limit ?? 50
    });

    return entries.map(mapEntry);
  }

  async getEntry(id: string): Promise<EntryRecord | null> {
    const entry = await this.prisma.entry.findUnique({
      where: { id },
      include: entryInclude
    });

    return entry ? mapEntry(entry) : null;
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
    const question = await this.prisma.question.findUnique({
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
    });

    if (!question) {
      return null;
    }

    return {
      ...mapQuestion(question),
      entries: question.entries.map(({ entry }) => mapEntry(entry))
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

  async getContextMirrorSnapshot(): Promise<ContextMirrorSnapshot> {
    const [entries, openQuestions, themes, projects] = await Promise.all([
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
      })
    ]);

    return {
      entries,
      openQuestions: openQuestions.map(mapQuestion),
      themes: themes.map(mapNamed),
      projects: projects.map(mapNamed)
    };
  }
}

export function createPrismaContextRepository(): ContextRepository {
  return new PrismaContextRepository();
}
