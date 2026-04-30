"use server";

import { revalidatePath } from "next/cache";

import { createSavedFilterFromForm, initialMutationState, type MutationState } from "@/application/context-service";
import { isRecoverableReadError } from "@/application/errors";
import { createPrismaContextRepository } from "@/infrastructure/database/prisma-context-repository";

export { initialMutationState };

function databaseErrorState(): MutationState {
  return {
    status: "error",
    message: "De lokale database is niet beschikbaar. Start PostgreSQL en voer de migrations uit."
  };
}

export async function createSavedFilterAction(
  _previousState: MutationState,
  formData: FormData
): Promise<MutationState> {
  const result = await createSavedFilterFromForm(formData, createPrismaContextRepository()).catch((error: unknown) => {
    if (isRecoverableReadError(error)) {
      return { ok: false as const, state: databaseErrorState() };
    }

    throw error;
  });

  if (!result.ok) {
    return result.state;
  }

  revalidatePath("/ledger");
  revalidatePath("/command");
  return { status: "success", message: "Filter saved." };
}
