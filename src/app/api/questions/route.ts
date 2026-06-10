import { type NextRequest } from "next/server";

import { createQuestionCommandSchema, listQuestionsQuerySchema } from "@/domain/context";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import type { QuestionRecord } from "@/repositories/context-repository";

import { apiError, apiOk, withApiErrors } from "../_lib";

export const dynamic = "force-dynamic";

function toDto(q: QuestionRecord) {
  return {
    id: q.id,
    prompt: q.prompt,
    status: q.status,
    privacyLevel: q.privacyLevel,
    summary: q.summary,
    originEntryId: q.originEntryId,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt
  };
}

export async function GET(request: NextRequest) {
  return withApiErrors(async () => {
    const sp = request.nextUrl.searchParams;

    const parsed = listQuestionsQuerySchema.safeParse({
      status: sp.get("status") ?? undefined,
      privacyLevel: sp.get("privacyLevel") ?? undefined,
      limit: sp.has("limit") ? Number(sp.get("limit")) : undefined
    });

    if (!parsed.success) {
      return apiError("Invalid query parameters: " + parsed.error.issues.map((i) => i.message).join(", "), 400);
    }

    const repo = createPrismaContextRepository();
    const questions = await repo.listQuestions(parsed.data);
    return apiOk(questions.map(toDto));
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

    const parsed = createQuestionCommandSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed: " + parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "), 422);
    }

    const repo = createPrismaContextRepository();
    const question = await repo.createQuestion(parsed.data);
    return apiOk(toDto(question), 201);
  });
}
