"use server";

import { revalidatePath } from "next/cache";

import {
  createAttachmentFromForm,
  createReferenceFromForm,
  createThreadFromForm,
  initialMutationState,
  linkObjectsFromForm,
  type MutationState
} from "@/application/context-service";
import { isRecoverableReadError } from "@/application/errors";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";

export { initialMutationState };

function databaseErrorState(): MutationState {
  return {
    status: "error",
    message: "De lokale database is niet beschikbaar. Start PostgreSQL en voer de migrations uit."
  };
}

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
        return { ok: false as const, state: databaseErrorState() };
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
        return { ok: false as const, state: databaseErrorState() };
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
      return { ok: false as const, state: databaseErrorState() };
    }

    throw error;
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath(`/entries/${entryId}`);
  return successState("Relationship created.");
}

export async function createThreadWithEntryAction(
  entryId: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  formData.set("entryIds", entryId);

  const result = await createThreadFromForm(formData, createPrismaContextRepository()).catch((error: unknown) => {
    if (isRecoverableReadError(error)) {
      return { ok: false as const, state: databaseErrorState() };
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
