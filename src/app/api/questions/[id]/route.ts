import { type NextRequest } from "next/server";

import { validateQuestionClosing } from "@/application/context-service";
import { updateQuestionCommandSchema } from "@/domain/context";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { isValidId } from "@/lib/format";

import { apiError, apiOk, withApiErrors } from "../../_lib";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiErrors(async () => {
    const { id } = await params;
    if (!isValidId(id)) return apiError("Invalid id.", 400);

    const repo = createPrismaContextRepository();
    const question = await repo.getQuestion(id);
    if (!question) return apiError("Question not found.", 404);

    return apiOk({
      id: question.id,
      prompt: question.prompt,
      status: question.status,
      privacyLevel: question.privacyLevel,
      summary: question.summary,
      originEntryId: question.originEntryId,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      entries: question.entries.map((e) => ({ id: e.id, title: e.title, type: e.type, capturedAt: e.capturedAt }))
    });
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
    const parsed = updateQuestionCommandSchema.safeParse({ ...raw, id });
    if (!parsed.success) {
      return apiError("Validation failed: " + parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "), 422);
    }

    const repo = createPrismaContextRepository();
    const existing = await repo.getQuestion(id);
    if (!existing) return apiError("Question not found.", 404);

    const closingError = await validateQuestionClosing(id, parsed.data.status, repo);
    if (closingError) return apiError(closingError, 422);

    const question = await repo.updateQuestion(parsed.data);
    return apiOk({
      id: question.id,
      prompt: question.prompt,
      status: question.status,
      privacyLevel: question.privacyLevel,
      summary: question.summary,
      updatedAt: question.updatedAt
    });
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
    const existing = await repo.getQuestion(id);
    if (!existing) return apiError("Question not found.", 404);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    const patch = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

    const merged = {
      id,
      status: patch.status ?? existing.status,
      privacyLevel: patch.privacyLevel ?? existing.privacyLevel,
      summary: "summary" in patch ? patch.summary : existing.summary
    };

    const parsed = updateQuestionCommandSchema.safeParse(merged);
    if (!parsed.success) {
      return apiError("Validation failed: " + parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "), 422);
    }

    const closingError = await validateQuestionClosing(id, parsed.data.status, repo);
    if (closingError) return apiError(closingError, 422);

    const question = await repo.updateQuestion(parsed.data);
    return apiOk({
      id: question.id,
      prompt: question.prompt,
      status: question.status,
      privacyLevel: question.privacyLevel,
      summary: question.summary,
      updatedAt: question.updatedAt
    });
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
    const existing = await repo.getQuestion(id);
    if (!existing) return apiError("Question not found.", 404);

    await repo.deleteQuestion(id);
    return apiOk({ deleted: id });
  });
}
