"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAttachmentFromForm,
  createReferenceFromForm,
  createThreadFromForm,
  promoteEntryToQuestion,
  type MutationState
} from "@/application/context-service";
import { isDatabaseUnavailable } from "@/application/errors";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";
import { isValidId } from "@/lib/format";



function successState(message: string): MutationState {
  return {
    status: "success",
    message
  };
}

export async function addReferenceAction(
  entryId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  if (!isValidId(entryId)) {
    return { status: "error", message: "Invalid entry id." };
  }

  const result = await createReferenceFromForm(entryId, formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/entries/${entryId}`);
  return successState("Reference linked.");
}

export async function addAttachmentAction(
  entryId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  if (!isValidId(entryId)) {
    return { status: "error", message: "Invalid entry id." };
  }

  const result = await createAttachmentFromForm(entryId, formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/entries/${entryId}`);
  return successState("Attachment metadata linked.");
}

export async function promoteEntryToQuestionAction(
  entryId: string,
  _previousState: MutationState
): Promise<MutationState> {
  void _previousState;

  if (!isValidId(entryId)) {
    return { status: "error", message: "Invalid entry id." };
  }

  const result = await promoteEntryToQuestion(entryId, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/");
  revalidatePath("/ledger");
  revalidatePath("/cabinet");
  revalidatePath("/map");
  revalidatePath(`/entries/${entryId}`);
  revalidatePath(`/questions/${result.question.id}`);
  redirect(`/questions/${result.question.id}`);
}

export async function createThreadWithEntryAction(
  entryId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  if (!isValidId(entryId)) {
    return { status: "error", message: "Invalid entry id." };
  }

  formData.set("entryIds", entryId);

  const result = await createThreadFromForm(formData, createPrismaContextRepository());

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/entries/${entryId}`);
  revalidatePath("/threads");
  return successState("Thread created.");
}

export async function deleteEntryAction(entryId: string): Promise<void> {
  if (!isValidId(entryId)) return;

  try {
    await createPrismaContextRepository().deleteEntry(entryId);
  } catch (error) {
    if (isDatabaseUnavailable(error)) return;
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/ledger");
  revalidatePath("/cabinet");
  revalidatePath("/map");
  redirect("/ledger");
}
