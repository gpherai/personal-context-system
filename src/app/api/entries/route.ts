import { type NextRequest } from "next/server";

import { createEntryCommandSchema, listEntriesQuerySchema, titleFromBody } from "@/domain/context";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import type { EntryListItem } from "@/repositories/context-repository";

import { apiError, apiOk, withApiErrors } from "../_lib";

export const dynamic = "force-dynamic";

type EntryListDto = {
  id: string;
  type: string;
  status: string;
  title: string;
  privacyLevel: string;
  capturedAt: Date;
  themes: { id: string; slug: string; name: string }[];
  projects: { id: string; slug: string; name: string }[];
};

function toListDto(entry: EntryListItem): EntryListDto {
  return {
    id: entry.id,
    type: entry.type,
    status: entry.status,
    title: entry.title,
    privacyLevel: entry.privacyLevel,
    capturedAt: entry.capturedAt,
    themes: entry.themes.map(({ id, slug, name }) => ({ id, slug, name })),
    projects: entry.projects.map(({ id, slug, name }) => ({ id, slug, name }))
  };
}

export async function GET(request: NextRequest) {
  return withApiErrors(async () => {
    const sp = request.nextUrl.searchParams;

    const parsed = listEntriesQuerySchema.safeParse({
      status: sp.get("status") ?? undefined,
      type: sp.get("type") ?? undefined,
      privacyLevel: sp.get("privacyLevel") ?? undefined,
      limit: sp.has("limit") ? Number(sp.get("limit")) : undefined
    });

    if (!parsed.success) {
      return apiError("Invalid query parameters: " + parsed.error.issues.map((i) => i.message).join(", "), 400);
    }

    const repo = createPrismaContextRepository();
    const entries = await repo.listEntries(parsed.data);
    return apiOk(entries.map(toListDto));
  });
}

export async function POST(request: NextRequest) {
  return withApiErrors(async () => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    if (typeof body !== "object" || body === null) {
      return apiError("Body must be a JSON object.", 400);
    }

    const raw = body as Record<string, unknown>;

    // Quick-capture mode: only { text } provided
    if ("text" in raw && Object.keys(raw).length === 1) {
      const text = typeof raw.text === "string" ? raw.text.trim() : "";
      if (!text) return apiError("text is required.", 400);
      raw.body = text;
      raw.title = titleFromBody(text);
    }

    // Coerce occurredAt string → Date
    if (typeof raw.occurredAt === "string") {
      raw.occurredAt = new Date(raw.occurredAt);
    }

    const parsed = createEntryCommandSchema.safeParse(raw);
    if (!parsed.success) {
      return apiError("Validation failed: " + parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "), 422);
    }

    const repo = createPrismaContextRepository();
    const entry = await repo.createEntry(parsed.data);

    return apiOk(
      {
        id: entry.id,
        type: entry.type,
        status: entry.status,
        title: entry.title,
        privacyLevel: entry.privacyLevel,
        capturedAt: entry.capturedAt
      },
      201
    );
  });
}
