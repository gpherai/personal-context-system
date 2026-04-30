"use server";

import { revalidatePath } from "next/cache";

import {
  initialMutationState,
  linkObjectsFromForm,
  updateQuestionFromForm,
  type MutationState
} from "@/application/context-service";
import { DATABASE_UNAVAILABLE_MESSAGE, isRecoverableReadError } from "@/application/errors";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";

export { initialMutationState };

function databaseErrorState(): MutationState {
  return {
    status: "error",
    message: DATABASE_UNAVAILABLE_MESSAGE
  };
}

export async function updateQuestionAction(
  questionId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  const result = await updateQuestionFromForm(questionId, formData, createPrismaContextRepository()).catch(
    (error: unknown) => {
      if (isRecoverableReadError(error)) {
        return { ok: false as const, state: databaseErrorState() };
      }

      throw error;
    }
  );

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
  formData.set("fromType", "question");
  formData.set("fromId", questionId);

  const result = await linkObjectsFromForm(formData, createPrismaContextRepository()).catch((error: unknown) => {
    if (isRecoverableReadError(error)) {
      return { ok: false as const, state: databaseErrorState() };
    }

    throw error;
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/questions/${questionId}`);
  return { status: "success", message: "Relationship created." };
}
