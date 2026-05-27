"use server";

import { revalidatePath } from "next/cache";

import {
  initialMutationState,
  linkObjectsFromForm,
  updateQuestionFromForm,
  type MutationState
} from "@/application/context-service";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { isValidId } from "@/lib/format";

export { initialMutationState };

export async function updateQuestionAction(
  questionId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  if (!isValidId(questionId)) {
    return { status: "error", message: "Invalid question id." };
  }

  const result = await updateQuestionFromForm(questionId, formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/");
  revalidatePath("/cabinet");
  revalidatePath(`/questions/${questionId}`);
  return { status: "success", message: "Question updated." };
}

export async function linkFromQuestionAction(
  questionId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  if (!isValidId(questionId)) {
    return { status: "error", message: "Invalid question id." };
  }

  formData.set("fromType", "question");
  formData.set("fromId", questionId);

  const result = await linkObjectsFromForm(formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/questions/${questionId}`);
  return { status: "success", message: "Relationship created." };
}
