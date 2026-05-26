"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAttachmentFromForm,
  createReferenceFromForm,
  createThreadFromForm,
  initialMutationState,
  linkObjectsFromForm,
  promoteEntryToQuestion,
  type MutationState
} from "@/application/context-service";
import { databaseMutationErrorState, isRecoverableReadError } from "@/application/errors";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";

export { initialMutationState };

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
  const result = await createReferenceFromForm(entryId, formData, createPrismaContextRepository()).catch(
    (error: unknown) => {
      if (isRecoverableReadError(error)) {
        return { ok: false as const, state: databaseMutationErrorState() };
      }

      throw error;
    }
  );

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
  const result = await createAttachmentFromForm(entryId, formData, createPrismaContextRepository()).catch(
    (error: unknown) => {
      if (isRecoverableReadError(error)) {
        return { ok: false as const, state: databaseMutationErrorState() };
      }

      throw error;
    }
  );

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/entries/${entryId}`);
  return successState("Attachment metadata linked.");
}

export async function linkFromEntryAction(
  entryId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  formData.set("fromType", "entry");
  formData.set("fromId", entryId);

  const result = await linkObjectsFromForm(formData, createPrismaContextRepository()).catch((error: unknown) => {
    if (isRecoverableReadError(error)) {
      return { ok: false as const, state: databaseMutationErrorState() };
    }

    throw error;
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/entries/${entryId}`);
  return successState("Relationship created.");
}

export async function promoteEntryToQuestionAction(
  entryId: string,
  _previousState: MutationState
): Promise<MutationState> {
  void _previousState;

  const result = await promoteEntryToQuestion(entryId, createPrismaContextRepository()).catch((error: unknown) => {
    if (isRecoverableReadError(error)) {
      return { ok: false as const, state: databaseMutationErrorState() };
    }

    throw error;
  });

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
  formData.set("entryIds", entryId);

  const result = await createThreadFromForm(formData, createPrismaContextRepository()).catch((error: unknown) => {
    if (isRecoverableReadError(error)) {
      return { ok: false as const, state: databaseMutationErrorState() };
    }

    throw error;
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/entries/${entryId}`);
  revalidatePath("/threads");
  return successState("Thread created.");
}
