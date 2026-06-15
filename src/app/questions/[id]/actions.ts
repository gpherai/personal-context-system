"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  updateQuestionFromForm,
  type MutationState
} from "@/application/context-service";
import { isDatabaseUnavailable } from "@/application/errors";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { isValidId } from "@/lib/format";



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

export async function deleteQuestionAction(questionId: string): Promise<void> {
  if (!isValidId(questionId)) return;

  try {
    await createPrismaContextRepository().deleteQuestion(questionId);
  } catch (error) {
    if (isDatabaseUnavailable(error)) return;
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/cabinet");
  revalidatePath("/map");
  redirect("/cabinet");
}
