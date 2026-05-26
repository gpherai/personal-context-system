"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { captureSource, deleteSource, updateSourceFromForm, type MutationState } from "@/application/context-service";
import { databaseMutationErrorState, isRecoverableReadError } from "@/application/errors";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";

export async function createSourceAction(
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  const result = await captureSource(formData, createPrismaContextRepository()).catch((error: unknown) => {
    if (isRecoverableReadError(error)) {
      return { ok: false as const, state: databaseMutationErrorState() };
    }

    throw error;
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/sources");
  revalidatePath("/cabinet");
  redirect(`/sources/${result.source.id}`);
}

export async function updateSourceAction(
  id: string,
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  const result = await updateSourceFromForm(id, formData, createPrismaContextRepository()).catch((error: unknown) => {
    if (isRecoverableReadError(error)) {
      return { ok: false as const, state: databaseMutationErrorState() };
    }

    throw error;
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/sources");
  revalidatePath(`/sources/${id}`);
  revalidatePath("/cabinet");
  redirect(`/sources/${id}`);
}

export async function deleteSourceAction(id: string): Promise<MutationState> {
  const result = await deleteSource(id, createPrismaContextRepository()).catch((error: unknown) => {
    if (isRecoverableReadError(error)) {
      return { ok: false as const, state: databaseMutationErrorState() };
    }

    throw error;
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/sources");
  revalidatePath("/cabinet");
  redirect("/sources");
}
