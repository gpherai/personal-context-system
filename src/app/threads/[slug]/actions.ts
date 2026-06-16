"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { addEntryToThreadFromForm, moveEntryInThread, type MutationState } from "@/application/context-service";
import { isDatabaseUnavailable } from "@/application/errors";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { isValidId } from "@/lib/format";

export async function deleteThreadAction(threadId: string): Promise<void> {
  try {
    await createPrismaContextRepository().deleteThread(threadId);
  } catch (error) {
    if (isDatabaseUnavailable(error)) return;
    throw error;
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
    return { status: "error", message: "Ongeldig draad-id." };
  }

  const result = await addEntryToThreadFromForm(threadId, formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/threads/${threadSlug}`);
  return { status: "success", message: "Notitie toegevoegd aan draad." };
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
