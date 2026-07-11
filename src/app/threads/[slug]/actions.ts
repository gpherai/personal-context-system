"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { addEntryToThreadFromForm, moveEntryInThread, type MutationState } from "@/application/context-service";
import { databaseMutationErrorState, isDatabaseUnavailable } from "@/application/errors";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { isValidId } from "@/lib/format";

export async function deleteThreadAction(
  threadId: string,
  _previousState: MutationState,
  _formData: FormData
): Promise<MutationState> {
  if (!isValidId(threadId)) {
    return { status: "error", message: "Invalid thread id." };
  }

  try {
    await createPrismaContextRepository().deleteThread(threadId);
  } catch (error) {
    if (isDatabaseUnavailable(error)) return databaseMutationErrorState();
    return { status: "error", message: error instanceof Error ? error.message : "Could not delete thread." };
  }

  revalidatePath("/threads");
  redirect("/threads");
}

export async function addEntryToThreadAction(
  threadSlug: string,
  threadId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  if (!isValidId(threadId)) {
    return { status: "error", message: "Invalid thread id." };
  }

  const result = await addEntryToThreadFromForm(threadId, formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/threads/${threadSlug}`);
  return { status: "success", message: "Entry added to thread." };
}

export async function moveEntryInThreadAction(
  threadSlug: string,
  threadId: string,
  entryId: string,
  direction: "up" | "down"
): Promise<void> {
  if (!isValidId(threadId) || !isValidId(entryId)) return;

  const result = await moveEntryInThread(threadId, entryId, direction, createPrismaContextRepository());
  if (!result.ok) return;

  revalidatePath(`/threads/${threadSlug}`);
}
