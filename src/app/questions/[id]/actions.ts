"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createDecisionFromForm,
  createTaskFromForm,
  updateDecisionStatusFromForm,
  updateQuestionFromForm,
  updateTaskStatusFromForm,
  type MutationState
} from "@/application/context-service";
import { databaseMutationErrorState, isDatabaseUnavailable } from "@/application/errors";
import type { DecisionStatus } from "@/domain/context";
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

export async function createDecisionAction(
  questionId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  if (!isValidId(questionId)) {
    return { status: "error", message: "Invalid question id." };
  }

  const result = await createDecisionFromForm(questionId, formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/questions/${questionId}`);
  return { status: "success", message: "Decision toegevoegd." };
}

export async function updateDecisionStatusAction(
  decisionId: string,
  currentStatus: DecisionStatus,
  questionId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  const result = await updateDecisionStatusFromForm(decisionId, currentStatus, formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/questions/${questionId}`);
  return { status: "success", message: "Decision status updated." };
}

export async function createTaskAction(
  questionId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  if (!isValidId(questionId)) {
    return { status: "error", message: "Invalid question id." };
  }

  const result = await createTaskFromForm(questionId, formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/questions/${questionId}`);
  return { status: "success", message: "Task toegevoegd." };
}

export async function updateTaskStatusAction(
  taskId: string,
  questionId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  const result = await updateTaskStatusFromForm(taskId, formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/questions/${questionId}`);
  return { status: "success", message: "Task status updated." };
}

export async function deleteQuestionAction(
  questionId: string,
  _previousState: MutationState,
  _formData: FormData
): Promise<MutationState> {
  if (!isValidId(questionId)) {
    return { status: "error", message: "Invalid question id." };
  }

  try {
    await createPrismaContextRepository().deleteQuestion(questionId);
  } catch (error) {
    if (isDatabaseUnavailable(error)) return databaseMutationErrorState();
    return { status: "error", message: error instanceof Error ? error.message : "Could not delete question." };
  }

  revalidatePath("/");
  revalidatePath("/cabinet");
  revalidatePath("/map");
  redirect("/cabinet");
}
