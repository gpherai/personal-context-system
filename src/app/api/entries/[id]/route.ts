import { type NextRequest } from "next/server";

import { updateEntryCommandSchema } from "@/domain/context";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { isValidId } from "@/lib/format";
import type { EntryRecord } from "@/repositories/context-repository";

import { apiError, apiOk, withApiErrors } from "../../_lib";

// Trusted local CRUD surface (read + write by id). This is NOT the outward
// shareable boundary — that is /api/entries (list) and /api/dashboard, which
// only ever return shareable records. These by-id routes assume a trusted caller.
export const dynamic = "force-dynamic";

type EntryDetailDto = {
  id: string;
  type: string;
  status: string;
  title: string;
  body: string;
  summary?: string;
  source?: string;
  confidence?: number;
  privacyLevel: string;
  occurredAt?: Date;
  capturedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  themes: { id: string; slug: string; name: string }[];
  projects: { id: string; slug: string; name: string }[];
  questions: { id: string; prompt: string; status: string }[];
  sources: { id: string; type: string; title: string }[];
};

function toDetailDto(entry: EntryRecord): EntryDetailDto {
  return {
    id: entry.id,
    type: entry.type,
    status: entry.status,
    title: entry.title,
    body: entry.body,
    summary: entry.summary,
    source: entry.source,
    confidence: entry.confidence,
    privacyLevel: entry.privacyLevel,
    occurredAt: entry.occurredAt,
    capturedAt: entry.capturedAt,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    themes: entry.themes.map(({ id, slug, name }) => ({ id, slug, name })),
    projects: entry.projects.map(({ id, slug, name }) => ({ id, slug, name })),
    questions: entry.questions.map(({ id, prompt, status }) => ({ id, prompt, status })),
    sources: entry.sources.map(({ id, type, title }) => ({ id, type, title }))
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiErrors(async () => {
    const { id } = await params;
    if (!isValidId(id)) return apiError("Invalid id.", 400);

    const repo = createPrismaContextRepository();
    const entry = await repo.getEntry(id);
    if (!entry) return apiError("Entry not found.", 404);

    return apiOk(toDetailDto(entry));
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiErrors(async () => {
    const { id } = await params;
    if (!isValidId(id)) return apiError("Invalid id.", 400);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const raw = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    if (typeof raw.occurredAt === "string") raw.occurredAt = new Date(raw.occurredAt);

    const parsed = updateEntryCommandSchema.safeParse({ ...raw, id });
    if (!parsed.success) {
      return apiError("Validation failed: " + parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "), 422);
    }

    const repo = createPrismaContextRepository();
    const existing = await repo.getEntry(id);
    if (!existing) return apiError("Entry not found.", 404);

    const entry = await repo.updateEntry(parsed.data);
    return apiOk(toDetailDto(entry));
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiErrors(async () => {
    const { id } = await params;
    if (!isValidId(id)) return apiError("Invalid id.", 400);

    const repo = createPrismaContextRepository();
    const existing = await repo.getEntry(id);
    if (!existing) return apiError("Entry not found.", 404);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const patch = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    if (typeof patch.occurredAt === "string") patch.occurredAt = new Date(patch.occurredAt);

    // Merge patch over existing values
    const merged = {
      id,
      type: patch.type ?? existing.type,
      status: patch.status ?? existing.status,
      title: patch.title ?? existing.title,
      body: patch.body ?? existing.body,
      summary: "summary" in patch ? patch.summary : existing.summary,
      source: "source" in patch ? patch.source : existing.source,
      confidence: "confidence" in patch ? patch.confidence : existing.confidence,
      privacyLevel: patch.privacyLevel ?? existing.privacyLevel,
      occurredAt: "occurredAt" in patch ? patch.occurredAt : existing.occurredAt,
      themeNames: patch.themeNames ?? existing.themes.map((t) => t.name),
      projectNames: patch.projectNames ?? existing.projects.map((p) => p.name),
      metadata: patch.metadata ?? existing.metadata
    };

    const parsed = updateEntryCommandSchema.safeParse(merged);
    if (!parsed.success) {
      return apiError("Validation failed: " + parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "), 422);
    }

    const updated = await repo.updateEntry(parsed.data);
    return apiOk(toDetailDto(updated));
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiErrors(async () => {
    const { id } = await params;
    if (!isValidId(id)) return apiError("Invalid id.", 400);

    const repo = createPrismaContextRepository();
    const existing = await repo.getEntry(id);
    if (!existing) return apiError("Entry not found.", 404);

    await repo.deleteEntry(id);
    return apiOk({ deleted: id });
  });
}
